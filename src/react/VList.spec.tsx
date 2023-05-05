import { afterEach, it, expect, describe /*jest*/ } from "@jest/globals";
import { render, cleanup /*waitFor*/ } from "@testing-library/react";
// import { useEffect, useRef } from "react";

import { CustomWindowComponentProps, VList /*VListHandle */ } from "./VList";
import { forwardRef } from "react";

const ITEM_HEIGHT = 50;
const ITEM_WIDTH = 100;
const VIEWPORT_HEIGHT = ITEM_HEIGHT * 10;

global.ResizeObserver = class {
  observers = new Set<Element>();
  callback: ResizeObserverCallback;
  first = false;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  disconnect() {
    this.observers.clear();
  }
  observe(e: HTMLElement) {
    this.observers.add(e);

    if (this.first) {
      // HACK: first observing should be root
      const entry: Pick<ResizeObserverEntry, "contentRect" | "target"> = {
        contentRect: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          width: ITEM_WIDTH,
          height: VIEWPORT_HEIGHT,
          x: 0,
          y: 0,
          toJSON() {},
        },
        target: e,
      };
      this.callback([entry] as any, this);
      this.first = false;
      return;
    }

    const entry: Pick<ResizeObserverEntry, "contentRect" | "target"> = {
      contentRect: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
        x: 0,
        y: 0,
        toJSON() {},
      },
      target: e,
    };
    this.callback([entry] as any, this);
  }
  unobserve(_target: Element) {}
};
global.IntersectionObserver = class {
  observers = new Set<Element>();
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  disconnect() {
    this.observers.clear();
  }
  observe(e: HTMLElement) {
    this.observers.add(e);
  }
  unobserve() {}
  takeRecords() {
    return [];
  }
  root = null;
  rootMargin = "";
  thresholds = [];
};

afterEach(cleanup);

it("should pass attributes to element", async () => {
  const { asFragment } = render(
    <VList
      id="id"
      className="class"
      tabIndex={0}
      role="list"
      aria-label="test"
      style={{ background: "red" }}
    >
      <div>0</div>
    </VList>
  );
  expect(asFragment()).toMatchSnapshot();
});

it("should change components", async () => {
  const UlList = forwardRef<HTMLDivElement, CustomWindowComponentProps>(
    ({ children, attrs, scrollSize }, ref) => {
      return (
        <div ref={ref} {...attrs}>
          <ul style={{ position: "relative", height: scrollSize, margin: 0 }}>
            {children}
          </ul>
        </div>
      );
    }
  );
  const { asFragment } = render(
    <VList element={UlList} itemElement="li">
      <div>0</div>
      <div>1</div>
      <div>2</div>
      <div>3</div>
      <div>4</div>
    </VList>
  );
  expect(asFragment()).toMatchSnapshot();
});

describe("vertical", () => {
  it("should render 1 children", async () => {
    const { asFragment } = render(
      <VList>
        <div>0</div>
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("should render 5 children", () => {
    const { asFragment } = render(
      <VList>
        <div>0</div>
        <div>1</div>
        <div>2</div>
        <div>3</div>
        <div>4</div>
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("should render 100 children", () => {
    const { asFragment } = render(
      <VList>
        {Array.from({ length: 100 }).map((_, i) => (
          <div key={i}>{i}</div>
        ))}
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("should render 1000 children", () => {
    const { asFragment } = render(
      <VList>
        {Array.from({ length: 1000 }).map((_, i) => (
          <div key={i}>{i}</div>
        ))}
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("should render 10000 children", () => {
    const { asFragment } = render(
      <VList>
        {Array.from({ length: 10000 }).map((_, i) => (
          <div key={i}>{i}</div>
        ))}
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("should render non elements", () => {
    const { asFragment } = render(
      <VList>
        string
        {true}
        {false}
        {null}
        {undefined}
        {123}
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("should render fragments", () => {
    const { asFragment } = render(
      <VList>
        <>
          <div>fragment</div>
          <div>fragment</div>
          <div>fragment</div>
        </>
        <>
          <div>fragment</div>
        </>
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("should render component", () => {
    const Comp = ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    );
    const { asFragment } = render(
      <VList>
        <Comp>component</Comp>
        <Comp>component</Comp>
        <Comp>component</Comp>
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("should render with given width / height", () => {
    const { asFragment } = render(
      <VList style={{ width: 100, height: 800 }}>
        <div>0</div>
        <div>1</div>
        <div>2</div>
        <div>3</div>
        <div>4</div>
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});

describe("horizontal", () => {
  it("should render 1 children", async () => {
    const { asFragment } = render(
      <VList horizontal>
        <div>0</div>
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("should render 5 children", () => {
    const { asFragment } = render(
      <VList horizontal>
        <div>0</div>
        <div>1</div>
        <div>2</div>
        <div>3</div>
        <div>4</div>
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("should render 100 children", () => {
    const { asFragment } = render(
      <VList horizontal>
        {Array.from({ length: 100 }).map((_, i) => (
          <div key={i}>{i}</div>
        ))}
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("should render 1000 children", () => {
    const { asFragment } = render(
      <VList horizontal>
        {Array.from({ length: 1000 }).map((_, i) => (
          <div key={i}>{i}</div>
        ))}
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("should render 10000 children", () => {
    const { asFragment } = render(
      <VList horizontal>
        {Array.from({ length: 10000 }).map((_, i) => (
          <div key={i}>{i}</div>
        ))}
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("should render non elements", () => {
    const { asFragment } = render(
      <VList horizontal>
        string
        {true}
        {false}
        {null}
        {undefined}
        {123}
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("should render fragments", () => {
    const { asFragment } = render(
      <VList horizontal>
        <>
          <div>fragment</div>
          <div>fragment</div>
          <div>fragment</div>
        </>
        <>
          <div>fragment</div>
        </>
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("should render component", () => {
    const Comp = ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    );
    const { asFragment } = render(
      <VList horizontal>
        <Comp>component</Comp>
        <Comp>component</Comp>
        <Comp>component</Comp>
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("should render with given width / height", () => {
    const { asFragment } = render(
      <VList horizontal style={{ width: 100, height: 800 }}>
        <div>0</div>
        <div>1</div>
        <div>2</div>
        <div>3</div>
        <div>4</div>
      </VList>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});

// describe("reverse", () => {
//   it("should render if vertical", () => {
//     const { asFragment } = render(
//       <VList>
//         {Array.from({ length: 100 }).map((_, i) => (
//           <div key={i}>{i}</div>
//         ))}
//       </VList>
//     );
//     expect(asFragment()).toMatchSnapshot();
//   });

//   it("should render if horizontal", () => {
//     const { asFragment } = render(
//       <VList horizontal>
//         {Array.from({ length: 100 }).map((_, i) => (
//           <div key={i}>{i}</div>
//         ))}
//       </VList>
//     );
//     expect(asFragment()).toMatchSnapshot();
//   });
// });