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
        <li>Initially, QA, UAT, and Prod are on the same commit</li>
        <li>New feature branches F1 and F2 are created on UAT</li>
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
        <li>F1 is merged first resulting in QA fast-forwarding to F1</li>
        <li>
          F2 is merged after that resulting in a new merge commit that is ahead
          of both F1 and F2. F1 and F2 remain where they were and are not moved
          forward.
        </li>
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
        <li>
          Here, a fix is made on F1 and then F1 is merged into QA resulting in
          QA being on the new merge commit
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
          At the end of the sprint, QA will be released to UAT. This is a
          fast-forward for UAT. This commit should also be tagged
          Client-UAT-yyyy-mm-dd (a tag remains where it was, it does not advance
          like a branch).
        </li>
        <li>
          When a signoff is received, this tag will be useful, because the
          signoff may be received after UAT has already advanced further.
        </li>
        <li>New sprint will begin with feature branches F3 and F4 from UAT</li>
        <li>
          Feature branch F3 is merged into QA (QA fast-forwards to F3) so that
          QA can begin testing during the sprint.
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
        <li>
          F4 is merged into QA (new merge commit on QA), tested and released to
          UAT (fast-forward for UAT). New tag is created for this UAT movement
        </li>
        <li>
          Signoff is received for 1 Sep UAT release, so it is merged into Prod
          (fast-forward for Prod)
        </li>
        <li>
          An issue is encountered, and the I1 branch is created on Prod.
          Meanwhile, feature branch F5 is created on UAT and merged into QA
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
          The issue branch I1 is merged into UAT, tested internally, then
          deployed to client awaiting signoff
        </li>
        <li>Meanwhile, another issue I2 is created on Prod</li>
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
        names: ["cl1-UAT"],
        desc: "Merged I1 into UAT",
      },
      i2_0: { x: 3, from: "q3", names: [], desc: "I2: ..." },
      i2_1: { x: 3, from: "i2_0", names: ["cl1-I2"], desc: "I2: ..." },
    },
  },
  {
    desc: (
      <ul>
        <li>
          I2 is merged into UAT with a new merge commit on UAT. Signoff hasn't
          yet been received for I1.
        </li>
        <li>
          Signoff is received for I2. I2 is merged into Prod with a fast-forward
          for Prod.
        </li>
        <li>
          UAT is merged into QA so that QA remains ahead of UAT. Issue branches
          don't need to be explicitly merged into QA.
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
      f5_0: { x: 0, from: "q4", names: ["cl1-F5"], desc: "F5: ..." },
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
      i2_1: {
        x: 3,
        from: "i2_0",
        names: ["cl1-Prod", "cl1-I2"],
        desc: "I2: ...",
      },
      ui2: {
        x: 1,
        from: "i2_1",
        from2: "ui1",
        names: ["cl1-UAT"],
        desc: "Merged I2 into UAT",
      },
      q5: {
        x: 0,
        from: "ui2",
        from2: "f5_0",
        names: ["cl1-QA"],
        desc: "Merged UAT into QA",
      },
    },
  },
  {
    desc: (
      <ul>
        <li>Signoff is received for 15 Sep release.</li>
        <li>Signoff for I1 is still not received</li>
        <li>15 Sep tag is merged into Prod with a new merge commit on Prod</li>
        <li>
          Note that it is possible to figure out what has not been released to
          Prod by filtering the graph to exclude commits that are reachable from
          Prod. The same logic applies to UAT or QA. This logic only works as
          long as we never use cherry-picks. If a built-in tool does not provide
          this kind of filtering functionality, the git command-line probably
          does, and even if it doesn't, we can create a tool like this app to
          help us visualize this.
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
      f5_0: { x: 0, from: "q4", names: ["cl1-F5"], desc: "F5: ..." },
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
      i2_1: {
        x: 3,
        from: "i2_0",
        names: ["cl1-I2"],
        desc: "I2: ...",
      },
      ui2: {
        x: 1,
        from: "i2_1",
        from2: "ui1",
        names: ["cl1-UAT"],
        desc: "Merged I2 into UAT",
      },
      q5: {
        x: 0,
        from: "ui2",
        from2: "f5_0",
        names: ["cl1-QA"],
        desc: "Merged UAT into QA",
      },
      p1: {
        x: 4,
        from: "q4",
        from2: "i2_1",
        names: ["cl1-Prod"],
        desc: "Merged UAT-2023-09-15 into Prod",
      },
    },
  },
  {
    desc: (
      <ul>
        <li>Signoff is received for I1.</li>
        <li>I1 is merged into Prod with a new merge commit on Prod</li>
        <li>
          At this point, there is nothing on UAT that is not on Prod (except
          merge commits)
        </li>
        <li>
          Whenever we reach such a point, it is a good idea to merge UAT into
          Prod and fast-forward UAT on the new merge commit.
        </li>
        <li>
          It is also desirable to reset QA to UAT and rebase all feature
          branches that are not yet merged into UAT on UAT. These branches can
          then be merged into QA as usual
        </li>
        <li>
          This results in a new clean state. This is shown on the next page.
          Even if we don't do the reset and rebase, the state of the graph is
          still acceptable.
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
      f5_0: { x: 0, from: "q4", names: ["cl1-F5"], desc: "F5: ..." },
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
      i2_1: {
        x: 3,
        from: "i2_0",
        names: ["cl1-I2"],
        desc: "I2: ...",
      },
      ui2: {
        x: 1,
        from: "i2_1",
        from2: "ui1",
        names: ["cl1-UAT"],
        desc: "Merged I2 into UAT",
      },
      q5: {
        x: 0,
        from: "ui2",
        from2: "f5_0",
        names: ["cl1-QA"],
        desc: "Merged UAT into QA",
      },
      p1: {
        x: 4,
        from: "q4",
        from2: "i2_1",
        names: [],
        desc: "Merged UAT-2023-09-15 into Prod",
      },
      p2: {
        x: 5,
        from: "p1",
        from2: "i1_1",
        names: ["cl1-Prod"],
        desc: "Merged I1 into Prod",
      },
    },
  },
  {
    desc: (
      <ul>
        <li>
          Merged UAT into Prod and fast-forwarded it so UAT and Prod now
          coincide.
        </li>
        <li>Reset QA to UAT</li>
        <li>Rebased F5 on UAT</li>
        <li>Merged F5 on QA (fast-forward)</li>
        <li>We now have a new clean state.</li>
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
      f4_0: { x: 3, from: "q3", names: ["cl1-F4"], desc: "F4: ..." },
      q4: {
        x: 0,
        from: "f3_0",
        from2: "f4_0",
        names: ["cl1-UAT-2023-09-15"],
        desc: "Merged F4 into QA",
      },
      i1_0: { x: 1, from: "q3", names: [], desc: "I1: ..." },
      i1_1: { x: 1, from: "i1_0", names: ["cl1-I1"], desc: "I1: ..." },
      ui1: {
        x: 0,
        from: "i1_1",
        from2: "q4",
        names: [],
        desc: "Merged I1 into UAT",
      },
      i2_0: { x: 2, from: "q3", names: [], desc: "I2: ..." },
      i2_1: {
        x: 2,
        from: "i2_0",
        names: ["cl1-I2"],
        desc: "I2: ...",
      },
      ui2: {
        x: 0,
        from: "i2_1",
        from2: "ui1",
        names: [],
        desc: "Merged I2 into UAT",
      },
      p1: {
        x: 3,
        from: "q4",
        from2: "i2_1",
        names: [],
        desc: "Merged UAT-2023-09-15 into Prod",
      },
      p2: {
        x: 4,
        from: "p1",
        from2: "i1_1",
        names: [],
        desc: "Merged I1 into Prod",
      },
      p3: {
        x: 0,
        from: "ui2",
        from2: "p2",
        names: ["cl1-UAT", "cl1-Prod"],
        desc: "Merged UAT into Prod",
      },
      f5_0: { x: 0, from: "p3", names: ["cl1-QA", "cl1-F5"], desc: "F5: ..." },
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
      <div ref={node} style={{ display: "flex", backgroundColor: "white" }}>
        <svg
          viewBox={`-20 -20 ${width} ${height}`}
          strokeWidth={2}
          style={{
            height: height,
            width: width,
            alignSelf: "flex-end",
            flexShrink: 0,
          }}
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
        {page.desc}
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
