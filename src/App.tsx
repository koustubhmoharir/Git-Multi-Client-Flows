import domtoimage from "dom-to-image";
import "./App.css";
import { useRef, Fragment, useState } from "react";

type Point = [x: number, y: number];
const sp = 20;

interface CommitDetail {
  x: number;
  from?: string;
  from2?: string;
  names: string[];
  desc: string;
}

type CommitsDict = Record<string, CommitDetail>;
interface Page {
  commits: CommitsDict;
  desc: JSX.Element;
}

const pages: Page[] = [
  {
    desc: (
      <ul>
        <li>Initially, all branches are on the same commit</li>
        <li>New feature branches will always be created on UAT</li>
      </ul>
    ),
    commits: {
      c0: { x: 0, names: ["cl1-QA", "cl1-UAT", "cl1-Prod"], desc: "initial" },
      f1_0: { x: 0, from: "c0", names: [], desc: "F1: ..." },
      f1_1: { x: 0, from: "f1_0", names: ["cl1-F1"], desc: "F1: ..." },
      f2_0: { x: 1, from: "c0", names: [], desc: "F2: ..." },
      f2_1: { x: 1, from: "f2_0", names: ["cl1-F1"], desc: "F2: ..." },
    },
  },
  {
    desc: (
      <ul>
        <li>These branches will be merged into QA</li>
      </ul>
    ),
    commits: {
      c0: { x: 0, names: ["cl1-UAT", "cl1-Prod"], desc: "initial" },
      f1_0: { x: 0, from: "c0", names: [], desc: "F1: ..." },
      f1_1: { x: 0, from: "f1_0", names: ["cl1-F1"], desc: "F1: ..." },
      f2_0: { x: 1, from: "c0", names: [], desc: "F2: ..." },
      f2_1: { x: 1, from: "f2_0", names: ["cl1-F2"], desc: "F2: ..." },
      q2: {
        x: 0,
        from: "f2_1",
        from2: "f1_1",
        names: ["cl1-QA"],
        desc: "Merged F2 into QA",
      },
    },
  },
  {
    desc: (
      <ul>
        <li>
          Fixes will be done on original branches and merged again into QA
        </li>
      </ul>
    ),
    commits: {
      c0: { x: 0, names: ["cl1-UAT", "cl1-Prod"], desc: "initial" },
      f1_0: { x: 0, from: "c0", names: [], desc: "F1: ..." },
      f1_1: { x: 0, from: "f1_0", names: [], desc: "F1: ..." },
      f2_0: { x: 2, from: "c0", names: [], desc: "F2: ..." },
      f2_1: { x: 2, from: "f2_0", names: ["cl1-F2"], desc: "F2: ..." },
      q2: {
        x: 1,
        from: "f2_1",
        from2: "f1_1",
        names: [],
        desc: "Merged F2 into QA",
      },
      f1_2: { x: 0, from: "f1_1", names: ["cl1-F1"], desc: "F1: ..." },
      q3: {
        x: 0,
        from: "q2",
        from2: "f1_2",
        names: ["cl1-QA"],
        desc: "Merged F1 into QA",
      },
    },
  },
  {
    desc: (
      <ul>
        <li>
          At the end of the sprint, QA will be released to UAT. This commit
          should be tagged cli-UAT-yyyy-mm-dd and new sprint will begin with
          feature branches from this UAT
        </li>
        <li>
          Whenever a signoff is received for this release to UAT, it will be
          merged (fast-forward) into Prod. The tag helps with locating this
          commit, because newer sprints might be merged into UAT before the
          signoff, moving the UAT branch forward.
        </li>
      </ul>
    ),
    commits: {
      c0: { x: 0, names: ["cl1-Prod"], desc: "initial" },
      f1_0: { x: 0, from: "c0", names: [], desc: "F1: ..." },
      f1_1: { x: 0, from: "f1_0", names: [], desc: "F1: ..." },
      f2_0: { x: 2, from: "c0", names: [], desc: "F2: ..." },
      f2_1: { x: 2, from: "f2_0", names: ["cl1-F2"], desc: "F2: ..." },
      q2: {
        x: 1,
        from: "f2_1",
        from2: "f1_1",
        names: [],
        desc: "Merged F2 into QA",
      },
      f1_2: { x: 0, from: "f1_1", names: ["cl1-F1"], desc: "F1: ..." },
      q3: {
        x: 0,
        from: "q2",
        from2: "f1_2",
        names: ["cl1-UAT-2023-09-01", "cli-UAT"],
        desc: "Merged F1 into QA",
      },
      f3_0: { x: 0, from: "q3", names: ["cl1-QA", "cl1-F3"], desc: "F3: ..." },
      f4_0: { x: 1, from: "q3", names: ["cl1-F4"], desc: "F4: ..." },
    },
  },
  {
    desc: (
      <ul>
        <li>When an issue is encountered, a branch will be created on Prod</li>
      </ul>
    ),
    commits: {
      c0: { x: 0, names: [], desc: "initial" },
      f1_0: { x: 0, from: "c0", names: [], desc: "F1: ..." },
      f1_1: { x: 0, from: "f1_0", names: [], desc: "F1: ..." },
      f2_0: { x: 2, from: "c0", names: [], desc: "F2: ..." },
      f2_1: { x: 2, from: "f2_0", names: ["cl1-F2"], desc: "F2: ..." },
      q2: {
        x: 1,
        from: "f2_1",
        from2: "f1_1",
        names: [],
        desc: "Merged F2 into QA",
      },
      f1_2: { x: 0, from: "f1_1", names: ["cl1-F1"], desc: "F1: ..." },
      q3: {
        x: 0,
        from: "q2",
        from2: "f1_2",
        names: ["cl1-UAT-2023-09-01", "cl1-Prod"],
        desc: "Merged F1 into QA",
      },
      f3_0: { x: 0, from: "q3", names: ["cl1-F3"], desc: "F3: ..." },
      f4_0: { x: 1, from: "q3", names: ["cl1-F4"], desc: "F4: ..." },
      q4: {
        x: 0,
        from: "f3_0",
        from2: "f4_0",
        names: ["cl1-UAT-2023-09-15", "cli-UAT"],
        desc: "Merged F4 into QA",
      },
      f5_0: { x: 0, from: "q4", names: ["cl1-F5", "cl1-QA"], desc: "F5: ..." },
      i1_0: { x: 2, from: "q3", names: [], desc: "I1: ..." },
      i1_1: { x: 2, from: "i1_0", names: ["cl1-I1"], desc: "I1: ..." },
    },
  },
  {
    desc: (
      <ul>
        <li>
          The issue branch will be merged into UAT and / or QA, tested
          internally, then deployed to client awaiting signoff
        </li>
        <li>
          When a signoff is received for deploying the issue, it will be merged
          into Prod
        </li>
      </ul>
    ),
    commits: {
      c0: { x: 0, names: [], desc: "initial" },
      f1_0: { x: 0, from: "c0", names: [], desc: "F1: ..." },
      f1_1: { x: 0, from: "f1_0", names: [], desc: "F1: ..." },
      f2_0: { x: 2, from: "c0", names: [], desc: "F2: ..." },
      f2_1: { x: 2, from: "f2_0", names: ["cl1-F2"], desc: "F2: ..." },
      q2: {
        x: 1,
        from: "f2_1",
        from2: "f1_1",
        names: [],
        desc: "Merged F2 into QA",
      },
      f1_2: { x: 0, from: "f1_1", names: ["cl1-F1"], desc: "F1: ..." },
      q3: {
        x: 0,
        from: "q2",
        from2: "f1_2",
        names: ["cl1-UAT-2023-09-01"],
        desc: "Merged F1 into QA",
      },
      f3_0: { x: 0, from: "q3", names: ["cl1-F3"], desc: "F3: ..." },
      f4_0: { x: 1, from: "q3", names: ["cl1-F4"], desc: "F4: ..." },
      q4: {
        x: 0,
        from: "f3_0",
        from2: "f4_0",
        names: ["cl1-UAT-2023-09-15"],
        desc: "Merged F4 into QA",
      },
      f5_0: { x: 0, from: "q4", names: ["cl1-F5", "cl1-QA"], desc: "F5: ..." },
      i1_0: { x: 2, from: "q3", names: [], desc: "I1: ..." },
      i1_1: { x: 2, from: "i1_0", names: ["cl1-I1"], desc: "I1: ..." },
      ui1: {
        x: 1,
        from: "i1_1",
        from2: "q4",
        names: [],
        desc: "Merged I1 into UAT",
      },
      i2_0: { x: 3, from: "q3", names: [], desc: "I2: ..." },
      i2_1: { x: 3, from: "i2_0", names: ["cl1-I2"], desc: "I2: ..." },
      ui2: {
        x: 1,
        from: "i2_1",
        from2: "ui1",
        names: ["cl1-UAT"],
        desc: "Merged I2 into UAT",
      },
      p1: {
        x: 2,
        from: "i1_1",
        from2: "i2_1",
        names: ["cl1-Prod"],
        desc: "Merged I2 into Prod",
      },
    },
  },
];

function Page({ index }: { index: number }) {
  const page = pages[index];
  const commits = page.commits;
  const keys = Object.keys(commits);
  const height = keys.length * sp + 40;
  const width = (Math.max(...keys.map((k) => commits[k].x)) + 1) * sp + 40;
  const commitYs = Object.fromEntries(keys.map((k, i) => [k, i]));

  const ox = 0;
  const oy = height - 40;
  const rad = 1.0 / 6;

  function x(c: number) {
    return ox + c * sp;
  }
  function y(c: number) {
    return oy - c * sp;
  }

  function pt(p: Point) {
    return x(p[0]) + " " + y(p[1]);
  }
  const opacity = 0.3;
  function arrowHead(p: Point) {
    const tip: Point = [p[0], p[1] - rad];
    return (
      <path
        d={`M ${pt(tip)} L ${pt([
          tip[0] - (rad * 5.0) / 8,
          tip[1] - rad,
        ])} L ${pt([tip[0] + (rad * 5.0) / 8, tip[1] - rad])}`}
        fill="currentColor"
        opacity={opacity}
      />
    );
  }

  function arrow(p1: Point, p2: Point) {
    return (
      <>
        {p2[0] === p1[0] || p2[1] === p1[1] ? (
          <path
            d={`M ${pt(p1)} L ${pt(p2)}`}
            fill="none"
            stroke="currentColor"
            opacity={opacity}
          />
        ) : (
          <path
            d={`M ${pt(p1)} C ${pt([p2[0], p1[1]])} ${pt([p2[0], p1[1]])} ${pt(
              p2,
            )}`}
            fill="none"
            stroke="currentColor"
            opacity={opacity}
          />
        )}
        {arrowHead(p2)}
      </>
    );
  }

  function commit(key: string, at: Point, from?: Point, from2?: Point) {
    return (
      <Fragment key={key}>
        <ellipse
          stroke="none"
          fill="currentColor"
          cx={x(at[0])}
          cy={y(at[1])}
          rx={sp * rad}
          ry={sp * rad}
        />
        {from ? arrow(from, at) : null}
        {from2 ? arrow(from2, at) : null}
      </Fragment>
    );
  }

  const node = useRef<HTMLDivElement>(null);
  const onSave = () => {
    domtoimage.toPng(node.current).then(function (dataUrl) {
      const link = document.createElement("a");
      link.download = "image.png";
      link.href = dataUrl;
      link.click();
    });
  };
  return (
    <div>
      {page.desc}
      <div ref={node} style={{ display: "flex", backgroundColor: "white" }}>
        <svg
          viewBox={`-20 -20 ${width} ${height}`}
          strokeWidth={2}
          style={{ height: height, width: width }}
        >
          {Object.entries(commits).map(([k, c], i) =>
            commit(
              k,
              [c.x, i],
              c.from ? [commits[c.from].x, commitYs[c.from]] : undefined,
              c.from2 ? [commits[c.from2].x, commitYs[c.from2]] : undefined,
            ),
          )}
        </svg>
        <div style={{ alignSelf: "flex-end", marginBottom: sp / 2 }}>
          {Object.entries(commits)
            .toReversed()
            .map(([k, c]) => (
              <div
                style={{ height: sp, display: "flex", alignItems: "center" }}
                key={k}
              >
                {c.names.map((n) => (
                  <span
                    style={{
                      backgroundColor: "lightblue",
                      margin: "0 0.5rem 0 0",
                      padding: "0 0.25rem",
                      whiteSpace: "nowrap",
                      borderRadius: 6,
                      fontSize: "14px",
                      lineHeight: `${sp - 2}px`,
                    }}
                    key={n}
                  >
                    {n}
                  </span>
                ))}
                <span
                  style={{
                    padding: "0 0.25rem",
                    whiteSpace: "nowrap",
                    fontSize: "14px",
                    lineHeight: `${sp - 2}px`,
                  }}
                >
                  {c.desc}
                </span>
              </div>
            ))}
        </div>
      </div>

      <div>
        <button onClick={onSave}>Save As Image</button>
      </div>
    </div>
  );
}

function App() {
  const [index, setIndex] = useState(0);
  return (
    <div>
      <button onClick={() => setIndex(Math.max(index - 1, 0))}>Previous</button>
      <button onClick={() => setIndex(Math.min(index + 1, pages.length - 1))}>
        Next
      </button>
      <Page index={index} />
    </div>
  );
}

export default App;
