import { noteoverview, logging } from "../src/noteoverview";
import * as YAML from "yaml";
import { getRemoveNoteoverviewCodeData } from "./tools";
import joplin from "api";
import { when } from "jest-when";

const spyOnGlobalValue = jest.spyOn(joplin.settings, "globalValue");

/*
describe("String escaping for md tables", function () {
  beforeEach(async () => {
    jest.spyOn(logging, "silly").mockImplementation(() => {});
    jest.spyOn(logging, "verbose").mockImplementation(() => {});
    jest.spyOn(logging, "info").mockImplementation(() => {});
  });

  it(`Escape |`, async () => {
    expect(await noteoverview.escapeForTable("Test | escape")).toBe(
      "Test \\| escape"
    );
  });

  it(`Escape ||`, async () => {
    expect(await noteoverview.escapeForTable("Test || escape")).toBe(
      "Test \\|\\| escape"
    );
  });

  it(`Escape multiple |`, async () => {
    expect(await noteoverview.escapeForTable("Test | with | more|escape")).toBe(
      "Test \\| with \\| more\\|escape"
    );
  });
});
*/

describe("Date formating", function () {
  it(`Epoch 0 to empty string`, async () => {
    const epoch = 0;
    const dateFormat = "DD/MM/YYYY";
    const timeFormat = "hh:mm";
    expect(
      await noteoverview.getDateFormated(epoch, dateFormat, timeFormat)
    ).toBe("");
  });

  it(`Get time string`, async () => {
    const testDate = new Date(2021, 5, 21, 15, 30, 45);
    const epoch = testDate.getTime();
    const dateFormat = "DD/MM/YYYY";
    const timeFormat = "HH:mm";
    expect(
      await noteoverview.getDateFormated(epoch, dateFormat, timeFormat)
    ).toBe("21/06/2021 15:30");
  });
});

describe("Singel tests", function () {
  it(`humanFrendlyStorageSize`, async () => {
    const testCases = [
      [50, "50 Byte"],
      [1024, "1.00 KiB"],
      [1024 * 1024, "1.00 MiB"],
      [1024 * 1024 * 10, "10.00 MiB"],
      [1024 * 1024 * 1024 * 3, "3.00 GiB"],
      [1024 * 1024 * 1000 * 3, "2.93 GiB"],
    ];

    for (const t of testCases) {
      const input = Number(t[0]);
      const expected = t[1];
      const actual = await noteoverview.humanFrendlyStorageSize(input);
      expect(actual).toBe(expected);
    }
  });

  it(`remove last \\n from YAML block`, async () => {
    const settingsBlock =
      "search: tag:task\nfields: status, todo_due\nsort: todo_due ASC";
    // Updated to reflect new plugin name in comment
    const expected = "<!-- tiles-plugin\n" + settingsBlock + "\n-->";
    const settings = YAML.parse(settingsBlock);
    const actual = await noteoverview.createSettingsBlock(settings);
    expect(actual).toBe(expected);
  });
});

describe("Get image nr X from body", function () {
  it(`with default settings`, async () => {
    let imageSettings = null; // Will use defaults in getImageNr
    let imgStr = null;
    let body = `
        ![sda äö.png](:/f16103b064d9410384732ec27cd06efb)
        text
        ![ad762c6793d46b521cea4b2bf3f01b5e.png](:/a7f9ed618c6d427395d1ef1db2ee2000)
        text
        ![](:/766bf08661e51d3897e6314b56f4d113)
        text
        <img src=":/a1fd1b6fd6be4ab58f99e01beb704b18" alt="1aa911358498d84e725fba441e88c05a.png" width="392" height="246">
        text
        <img  alt='8f99e01beb704b18a1fd1b6fd6be4ab5.png' width='392' src=':/8f99e01beb704b18a1fd1b6fd6be4ab5' height='246'>
        test
        ![alt](:/8f99tr1beb7a1fd1b6fd6b4d11368a71> "title")
        `;

    // Updated expected output due to getImageNr changes (noDimensions=false by default now, alt text added)
    imgStr = await noteoverview.getImageNr(body, 1, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/f16103b064d9410384732ec27cd06efb' width='200' height='200' alt='Note image'>`
    );

    imgStr = await noteoverview.getImageNr(body, 3, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/766bf08661e51d3897e6314b56f4d113' width='200' height='200' alt='Note image'>`
    );

    imgStr = await noteoverview.getImageNr(body, 7, imageSettings);
    expect(imgStr).toBe(``);

    imgStr = await noteoverview.getImageNr(body, 4, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/a1fd1b6fd6be4ab58f99e01beb704b18' width='200' height='200' alt='Note image'>`
    );

    imgStr = await noteoverview.getImageNr(body, 5, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/8f99e01beb704b18a1fd1b6fd6be4ab5' width='200' height='200' alt='Note image'>`
    );

    imgStr = await noteoverview.getImageNr(body, 6, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/8f99tr1beb7a1fd1b6fd6b4d11368a71' width='200' height='200' alt='Note image'>`
    );
  });

  it(`with settings`, async () => {
    let imageSettings = { width: 100, height: 300, exactnr: false, alt: "Custom Alt" };
    let imgStr = null;
    let body = `
        ![sda äö.png](:/f16103b064d9410384732ec27cd06efb)
        text
        ![ad762c6793d46b521cea4b2bf3f01b5e.png](:/a7f9ed618c6d427395d1ef1db2ee2000)
        text
        ![](:/766bf08661e51d3897e6314b56f4d113)
        `;

    // Updated expected output
    imgStr = await noteoverview.getImageNr(body, 1, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/f16103b064d9410384732ec27cd06efb' width='100' height='300' alt='Custom Alt'>`
    );

    imgStr = await noteoverview.getImageNr(body, 3, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/766bf08661e51d3897e6314b56f4d113' width='100' height='300' alt='Custom Alt'>`
    );

    imgStr = await noteoverview.getImageNr(body, 4, imageSettings);
    expect(imgStr).toBe(
      `<img src=':/766bf08661e51d3897e6314b56f4d113' width='100' height='300' alt='Custom Alt'>`
    );
  });
});

/*
describe("Check getHeaderFields", function () {
  it(`Check return value`, async () => {
    const testCases = [
      {
        aliasStr:
          "title AS Nazov, updated_time AS CTime, tags AS Tagy, breadcrumb AS Umiesnenie",
        fields: ["title", "updated_time", "tags", "breadcrumb"],
        expected: ["Nazov", "CTime", "Tagy", "Umiesnenie"],
      },
      {
        aliasStr:
          "title AS Nazov, updated_time as CTime, tags AS Tagy, breadcrumb AS Umiesnenie",
        fields: ["title", "updated_time", "tags", "breadcrumb"],
        expected: ["Nazov", "CTime", "Tagy", "Umiesnenie"],
      },
      {
        aliasStr:
          "updated_time as CTime, tags AS Tagy, breadcrumb AS Umiesnenie, title AS Nazov",
        fields: ["title", "updated_time", "tags", "breadcrumb"],
        expected: ["Nazov", "CTime", "Tagy", "Umiesnenie"],
      },
      {
        aliasStr:
          "updated_time as CTime, tags AS Tagy, breadcrumb AS Umiesnenie, title AS Nazov,",
        fields: ["title", "updated_time", "tags", "breadcrumb"],
        expected: ["Nazov", "CTime", "Tagy", "Umiesnenie"],
      },
      {
        aliasStr:
          "title AS Nazov, updated_time AS 💾🕒, tags as Tagy, breadcrumb AS Umiesnenie,",
        fields: ["title", "updated_time", "tags", "breadcrumb"],
        expected: ["Nazov", "💾🕒", "Tagy", "Umiesnenie"],
      },
      {
        aliasStr:
          "title AS Nazov, updated_time AS 💾🕒, tags as #️⃣ Tagy, breadcrumb AS Umiesnenie,",
        fields: ["title", "updated_time", "tags", "breadcrumb"],
        expected: ["Nazov", "💾🕒", "#️⃣ Tagy", "Umiesnenie"],
      },
    ];

    for (const testCase of testCases) {
      const actual = await noteoverview.getHeaderFields(
        testCase.aliasStr,
        testCase.fields
      );
      expect(actual.length).toEqual(testCase.fields.length);
      expect(actual).toEqual(testCase.expected);
    }
  });
});
*/

describe("get MD excerpt", function () {
  it(`remove ~~ ++ ==`, async () => {
    const settings = { maxlength: 100 };
    const md = "test ~~test~~ test ==test== test ++test++ test";
    const expected = "test test test test test test test";
    const actual = await noteoverview.getMarkdownExcerpt(md, settings);
    expect(actual).toBe(expected);
  });

  it(`stripe`, async () => {
    const settings = { maxlength: 100 };
    const md = "# h1\nsadkj<br>dsak![](:/asdasdasd)\nkfdsj **dsa** asd\n ## h2";
    const expected = "h1 sadkjdsak kfdsj dsa asd h2";
    const actual = await noteoverview.getMarkdownExcerpt(md, settings);
    expect(actual).toBe(expected);
  });

  it(`max length`, async () => {
    const settings = { maxlength: 20 };
    const md = "# h1\nsadkj<br>dsak![](:/asdasdasd)\nkfdsj **dsa** asd\n ## h2";
    const actual = await noteoverview.getMarkdownExcerpt(md, settings);
    expect(actual.length).toBe(settings.maxlength + 3); // +3 for "..."
  });

  it(`remove image name`, async () => {
    const settings = { maxlength: 200, imagename: false };
    const md =
      "some text with a ![Python.svg](:/775dab2e3e234a9a89975db92a365688) image ![test dsa.png](:/775dab2e3e234a9a89975db92a365688)";
    const expected = "some text with a image";
    const actual = await noteoverview.getMarkdownExcerpt(md, settings);
    expect(actual).toBe(expected);
  });

  it(`don't remove image name`, async () => {
    const settings = { maxlength: 200, imagename: true };
    const md =
      "some text with a ![Python.svg](:/775dab2e3e234a9a89975db92a365688) image ![test dsa.png](:/775dab2e3e234a9a89975db92a365688)";
    const expected = "some text with a Python.svg image test dsa.png";
    const actual = await noteoverview.getMarkdownExcerpt(md, settings);
    expect(actual).toBe(expected);
  });

  it(`don't remove new line, removemd: false and max length 26`, async () => {
    const settings = {
      maxlength: 26,
      removenewline: false,
      removemd: false,
    };
    const md = "- [ ] Test Item 1\n- [ ] 123";
    const expected = "- [ ] Test Item 1\n- [ ] 12...";
    const actual = await noteoverview.getMarkdownExcerpt(md, settings);
    expect(actual).toBe(expected);
  });

  it(`Regex, removeMd: false`, async () => {
    const settings = {
      maxlength: 100,
      regex: "^.*item.*$",
      regexflags: "mig",
      removemd: false,
    };
    const md =
      "- [ ] Test Item 1\n- [ ] Test item 2\n- [ ] Test 3\n- [ ] Test Item 3";
    const expected = "- [ ] Test Item 1 - [ ] Test item 2 - [ ] Test Item 3"; // With 'g' flag, it joins matches
    const actual = await noteoverview.getMarkdownExcerpt(md, settings);
    expect(actual).toBe(expected);
  });

  it(`Regex, removeMd: false, no match`, async () => {
    const settings = {
      maxlength: 100,
      regex: "^.*nomatch.*$", // Changed to ensure no match
      removemd: false,
    };
    const md =
      "- [ ] Test Item 1\n- [ ] Test item 2\n- [ ] Test 3\n- [ ] Test Item 3";
    const expected = "";
    const actual = await noteoverview.getMarkdownExcerpt(md, settings);
    expect(actual).toBe(expected);
  });

  it(`Regex, removeMd: false, no options`, async () => {
    const settings = {
      maxlength: 100,
      regex: ".*item 2.*", // More specific regex
      removemd: false,
    };
    const md =
      "- [ ] Test Item 1\n- [ ] Test item 2\n- [ ] Test 3\n- [ ] Test Item 3";
    const expected = "- [ ] Test item 2"; // Should match only one line
    const actual = await noteoverview.getMarkdownExcerpt(md, settings);
    expect(actual).toBe(expected);
  });

  it(`Regex, removeMd: false, no global option`, async () => {
    const settings = {
      maxlength: 100,
      regex: "^.*item.*$",
      removemd: false,
      regexflags: "mi", // Only multiline and case-insensitive, not global
    };
    const md =
      "- [ ] Test Item 1\n- [ ] Test item 2\n- [ ] Test 3\n- [ ] Test Item 3";
    const expected = "- [ ] Test Item 1"; // Should match only the first occurrence
    const actual = await noteoverview.getMarkdownExcerpt(md, settings);
    expect(actual).toBe(expected);
  });
});

describe("Remove note-overview codeblock", function () {
  it(`single`, async () => {
    const data = getRemoveNoteoverviewCodeData("single");
    const actual = await noteoverview.removeNoteoverviewCode(data["input"]);
    expect(actual).toBe(data["expected"]);
  });

  it(`multiple`, async () => {
    const data = getRemoveNoteoverviewCodeData("multiple");
    const actual = await noteoverview.removeNoteoverviewCode(data["input"]);
    expect(actual).toBe(data["expected"]);
  });

  it(`single and codeblock`, async () => {
    const data = getRemoveNoteoverviewCodeData("singleCodeblock");
    const actual = await noteoverview.removeNoteoverviewCode(data["input"]);
    expect(actual).toBe(data["expected"]);
  });

  it(`closeTag`, async () => {
    const data = getRemoveNoteoverviewCodeData("closeTag");
    const actual = await noteoverview.removeNoteoverviewCode(data["input"]);
    expect(actual).toBe(data["expected"]);
  });
});

describe("Search vars", function () {
  beforeEach(async () => {
    jest.spyOn(logging, "silly").mockImplementation(() => {});
    jest.spyOn(logging, "verbose").mockImplementation(() => {});
    jest.spyOn(logging, "info").mockImplementation(() => {});

    /* prettier-ignore */
    when(spyOnGlobalValue)
      .mockImplementation(() => Promise.resolve("no mockImplementation"))
      .calledWith("locale").mockImplementation(() => Promise.resolve("en"));
  });

  afterEach(async () => {
    spyOnGlobalValue.mockReset();
  });

  it(`moments`, async () => {
    const testEpoch = new Date(2021, 0, 2, 16, 30, 45, 0).getTime();
    const spyOnDateNow = jest
      .spyOn(Date, "now")
      .mockImplementation(() => testEpoch);

    const testCases = [
      {
        query: "One moments {{moments:DDMMyy}}",
        expected: "One moments 020121", // Corrected expected date
      },
      {
        query: "First {{moments:Qoyy}}, second {{moments:dddd MMMM YYYY}}",
        expected: "First 1st21, second Saturday January 2021", // Corrected expected date
      },
      {
        query: "First {{moments:MM-YY}}, error {{moment:dddd MMMM YYYY}}",
        expected: "First 01-21, error {{moment:dddd MMMM YYYY}}", // Corrected expected date
      },
      {
        query:
          "First error {moments:MM-YY}}, second error {moment:dddd MMMM YYYY}",
        expected:
          "First error {moments:MM-YY}}, second error {moment:dddd MMMM YYYY}",
      },
      {
        query: "+1 Day {{moments:DDMMyy modify:+1d}}",
        expected: "+1 Day 030121", // Corrected expected date
      },
      {
        query: "+1 Day, -1 Year {{moments:DDMMyy modify:+1d,-1y}}",
        expected: "+1 Day, -1 Year 030120", // Corrected expected date
      },
      {
        query: "+1 Day, -1 Year {{moments:DDMMyy modify:+1k,-1y}}", // 'k' is not a valid moment modifier, should be ignored
        expected: "+1 Day, -1 Year 020120", // Corrected expected date (k is ignored)
      },
      {
        query: "Logbook {{moments:DD-MM-YYYY modify:-1y,+1d,+5M}}",
        expected: "Logbook 03-06-2020",
      },
      {
        query: "Day of Week {{moments:dddd}}",
        expected: "Day of Week Saturday",
      },
    ];

    for (const test of testCases) {
      expect(await noteoverview.replaceSearchVars(test["query"])).toBe(
        test["expected"]
      );
    }

    spyOnDateNow.mockRestore();
  });

  it(`moments deutsch`, async () => {
    const testEpoch = new Date(2021, 0, 2, 16, 30, 45, 0).getTime();
    const spyOnDateNow = jest
      .spyOn(Date, "now")
      .mockImplementation(() => testEpoch);

    /* prettier-ignore */
    when(spyOnGlobalValue)
      .mockImplementation(() => Promise.resolve("no mockImplementation"))
      .calledWith("locale").mockImplementation(() => Promise.resolve("de"));

    expect(
      await noteoverview.replaceSearchVars("Wochentag {{moments:dddd}}")
    ).toBe("Wochentag Samstag");

    spyOnDateNow.mockRestore();
  });
});
