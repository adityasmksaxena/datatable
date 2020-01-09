window.onload = function() {
  const HEADERS = {
    BLANK: "",
    NAME: "name",
    CAPITAL: "capital",
    REGION: "region",
    SUBREGION: "sub region",
    POPULATION: "population"
  };

  const DATA_KEYS = {
    NAME: "name",
    CAPITAL: "capital",
    REGION: "region",
    SUBREGION: "subregion",
    POPULATION: "population"
  };

  const headerDataKeyMapper = Object.entries({
    [HEADERS.BLANK]: HEADERS.BLANK,
    [HEADERS.NAME]: DATA_KEYS.NAME,
    [HEADERS.CAPITAL]: DATA_KEYS.CAPITAL,
    [HEADERS.REGION]: DATA_KEYS.REGION,
    [HEADERS.SUBREGION]: DATA_KEYS.SUBREGION,
    [HEADERS.POPULATION]: DATA_KEYS.POPULATION
  }).reduce((acc, [key, value]) => {
    acc[key] = value;
    acc[value] = key;
    return acc;
  }, {});

  const SORT_ORDER = {
    ASC: "ascend",
    DESC: "descend"
  };

  // ** Table Configuration **
  const defaultConfig = {
    dataUrl: "https://restcountries.eu/rest/v2/all",
    headers: [
      HEADERS.BLANK,
      HEADERS.NAME,
      HEADERS.CAPITAL,
      HEADERS.REGION,
      HEADERS.SUBREGION,
      HEADERS.POPULATION
    ],
    sortable: [HEADERS.NAME, HEADERS.POPULATION],
    dataKeys: [
      DATA_KEYS.NAME,
      DATA_KEYS.CAPITAL,
      DATA_KEYS.REGION,
      DATA_KEYS.SUBREGION,
      DATA_KEYS.POPULATION
    ],
    dataPerPageOptions: [5, 10, 20, 50, 100],
    dataPerPage: 20
  };
  // ** Table Configuration Ends **

  // IIFE SCOPED VARIABLES
  let data = null;
  let sortKey = DATA_KEYS.NAME;
  let sortOrder = SORT_ORDER.ASC;

  let pageNo = 0;
  let totalPages = 0;
  let dataPerPage = defaultConfig.dataPerPage;

  // Initial Rendering and Data Fetching
  init();
  addSortHandlers();

  function sortData(data) {
    const sortedData = data.sort((country1, country2) => {
      const value1 = country1[sortKey];
      const value2 = country2[sortKey];

      const dataType = typeof country1[sortKey];
      if (dataType === "number") {
        return sortOrder === SORT_ORDER.ASC ? value1 - value2 : value2 - value1;
      } else if (dataType === "string") {
        return sortOrder === SORT_ORDER.ASC
          ? value1.localeCompare(value2)
          : value2.localeCompare(value1);
      } else {
        // TODO: not considering
        return 0;
      }
    });
    return sortedData;
  }

  function handleSort(key) {
    if (sortKey === key) {
      sortOrder =
        sortOrder === SORT_ORDER.ASC ? SORT_ORDER.DESC : SORT_ORDER.ASC;
    } else {
      sortKey = key;
      sortOrder = SORT_ORDER.ASC;
    }
    data = sortData(data);
    updateTableBody(data);
    updateTableHeader();
  }

  function addSortHandlers() {
    [...document.querySelectorAll("#tableHeader tr th")].forEach(el => {
      if (defaultConfig.sortable.includes(headerDataKeyMapper[el.id])) {
        el.classList.add("sortable");
        el.addEventListener("click", event => handleSort(el.id, event));
      }
    });
  }

  async function init() {
    const config = defaultConfig;

    const rootContainer = document.getElementById("root");
    const headerDiv = document.createElement("div");
    headerDiv.id = "headerDiv";
    const options = config.dataPerPageOptions.reduce(
      (acc, val) =>
        acc +
        `<option value="${val}"${
          dataPerPage === val ? " selected" : ""
        }>${val}</option>`,
      ""
    );
    headerDiv.innerHTML = `
      <label for="dataPerPage">Data per page : </label>
      <select id="dataPerPage">
        ${options}
      </select>
    `;
    headerDiv.onchange = event => {
      dataPerPage = +event.target.value;
      totalPages = Math.ceil(data.length / dataPerPage);
      if (totalPages <= pageNo) pageNo = totalPages - 1;
      updateTableBody(data);
    };
    rootContainer.appendChild(headerDiv);

    const newElTable = document.createElement("table");
    newElTable.className = "table";
    newElTable.id = "table";
    const tableHeader = getTableHeader();
    newElTable.appendChild(tableHeader);
    const tableBody = getTableBody(null, config.headers.length);
    newElTable.appendChild(tableBody);
    rootContainer.appendChild(newElTable);
    data = await getCountriesData(config.dataUrl, config.dataKeys);
    updateTableBody(data);
  }

  function getTableHeader() {
    const headers = defaultConfig.headers;
    const newElThead = document.createElement("thead");
    newElThead.id = "tableHeader";
    const newElTr = document.createElement("tr");
    const theadTrCellsFragment = document.createDocumentFragment();
    headers.map(header => {
      let newElTh = null;
      if (headerDataKeyMapper[header] === sortKey) {
        newElTh = document.createElement("th");
        newElTh.id = headerDataKeyMapper[header];
        const newElDiv = createElement("div", header.toUpperCase(), {
          className: `sorted-${sortOrder}`
        });
        newElTh.appendChild(newElDiv);
      } else {
        newElTh = createElement("th", header, {
          id: headerDataKeyMapper[header]
        });
      }
      if (header !== "") {
        newElTh.scope = "col";
      }
      theadTrCellsFragment.appendChild(newElTh);
    });
    newElTr.appendChild(theadTrCellsFragment);
    newElThead.appendChild(newElTr);
    return newElThead;
  }

  function updateTableHeader() {
    const oldTableHeader = document.getElementById("tableHeader");
    oldTableHeader.remove();
    const newTableHeader = getTableHeader();
    const elTable = document.getElementById("table");
    elTable.insertBefore(newTableHeader, elTable.firstChild);
    addSortHandlers();
  }

  function isObject(obj) {
    var type = typeof obj;
    return type === "function" || (type === "object" && !!obj);
  }

  function createElement(tagName, value, props) {
    const element = document.createElement(tagName);
    if (props && isObject(props)) {
      Object.entries(props).forEach(([key, value]) => {
        element[key] = value;
      });
    }
    if (typeof value === "number") {
      element.innerText = value; // TODO: review
    } else {
      const cellText = document.createTextNode(value);
      element.appendChild(cellText);
    }
    return element;
  }

  async function getCountriesData(dataUrl, dataKeys) {
    let countries = [];
    try {
      const response = await fetch(dataUrl);
      const countriesData = await response.json();
      countries = countriesData.map(country => {
        const filteredCountryObj = dataKeys.reduce((acc, key) => {
          acc[key] = country[key];
          return acc;
        }, {});
        return filteredCountryObj;
      });
    } catch (err) {
      console.error(err);
    }
    totalPages = Math.ceil(countries.length / dataPerPage);
    console.table(countries);
    const sortedCountries = sortData(countries);
    return sortedCountries;
  }

  function getRowCells(index, country) {
    const newRow = document.createElement("tr");
    const cells = document.createDocumentFragment();

    const indexCell = createElement("td", String(index + 1));
    cells.appendChild(indexCell);
    defaultConfig.dataKeys.forEach(key => {
      const value = country[key];
      const cell = createElement("td", value);
      cells.appendChild(cell);
    });
    newRow.appendChild(cells);
    return newRow;
  }

  function getTableBody(data, numberOfColumns) {
    const newElTbody = document.createElement("tbody");
    newElTbody.id = "tableBody";
    if (data == null || (data && data.length) === 0) {
      const row = document.createElement("tr");
      const text = data == null ? "Loading ..." : "No Record Found.";
      const element = createElement("td", "Loading...");
      element.colSpan = numberOfColumns;
      element.classList.add("row-data-center");
      row.appendChild(element);
      newElTbody.appendChild(row);
    } else {
      const rows = document.createDocumentFragment();
      if (dataPerPage) {
        const startIndex = pageNo * dataPerPage;
        for (
          let i = startIndex;
          i < data.length && i < startIndex + dataPerPage;
          i++
        ) {
          const country = data[i];
          const row = getRowCells(i, country);
          rows.appendChild(row);
        }
        addPaginationControl();
      } else {
        data.forEach((country, i) => {
          const row = getRowCells(i, country);
          rows.appendChild(row);
        });
      }
      newElTbody.appendChild(rows);
    }
    return newElTbody;
  }

  function updateTableBody(data, numberOfColumns) {
    const oldTableBody = document.getElementById("tableBody");
    oldTableBody.remove();
    const newTableBody = getTableBody(data, numberOfColumns);
    document.getElementById("table").appendChild(newTableBody);
  }

  function updatePageNumber(no) {
    pageNo = no;
    updateTableBody(data);
  }

  function addPaginationControl() {
    const oldPaginationContainer = document.getElementById(
      "paginationActionContainer"
    );
    if (oldPaginationContainer) {
      oldPaginationContainer.remove();
    }
    const rootContainer = document.getElementById("root");
    const newElDiv = document.createElement("div");
    newElDiv.id = "paginationActionContainer";

    const textDataPerPage = createElement(
      "span",
      `Showing max ${dataPerPage} rows per page.`,
      { className: "data-per-page" }
    );

    const textPages = createElement(
      "span",
      `page. ${pageNo + 1} of ${Math.ceil(totalPages)}`,
      { className: "text-pages" }
    );

    const buttonFragment = document.createDocumentFragment();

    const buttonFirstPage = createElement("button", "<<", {
      id: "buttonFirstPage",
      onclick: () => {
        updatePageNumber(0);
      },
      disabled: pageNo === 0
    });
    if (pageNo === 0) buttonFirstPage.classList.add("cursor-not-allowed");
    buttonFragment.appendChild(buttonFirstPage);

    const buttonPrev = createElement("button", "<", {
      id: "buttonPrev",
      onclick: () => {
        if (pageNo > 0) updatePageNumber(pageNo - 1);
      },
      disabled: pageNo === 0
    });
    if (pageNo === 0) buttonPrev.classList.add("cursor-not-allowed");
    buttonFragment.appendChild(buttonPrev);

    {
      let startIndex = pageNo > 1 ? pageNo - 2 : 0;
      for (
        let i = startIndex, j = 0;
        j < 5 && startIndex < totalPages;
        j++, startIndex++
      ) {
        const buttonPageNode = createElement("button", startIndex + 1, {
          onclick: (index => () => {
            updatePageNumber(index);
          })(startIndex)
        });
        buttonPageNode.classList.add("page-button");
        if (startIndex === pageNo)
          buttonPageNode.classList.add("page-button--active");
        buttonFragment.appendChild(buttonPageNode);
      }
    }

    const buttonNext = createElement("button", ">", {
      id: "buttonNext",
      onclick: () => {
        if (pageNo + 1 < totalPages) updatePageNumber(pageNo + 1);
      },
      disabled: pageNo === totalPages - 1
    });
    if (pageNo + 1 === dataPerPage)
      buttonNext.classList.add("cursor-not-allowed");
      buttonFragment.appendChild(buttonNext);

    const buttonLastPage = createElement("button", ">>", {
      id: "buttonLastPage",
      onclick: () => {
        updatePageNumber(totalPages - 1);
      },
      disabled: pageNo === totalPages - 1
    });
    if (pageNo + 1 === dataPerPage)
      buttonLastPage.classList.add("cursor-not-allowed");
    buttonFragment.appendChild(buttonLastPage);

    const pageJumpButtonContainer = document.createElement("div");
    pageJumpButtonContainer.id = "pageJumpButtonContainer";
    pageJumpButtonContainer.appendChild(buttonFragment)

    newElDiv.appendChild(textDataPerPage);
    newElDiv.appendChild(textPages);
    newElDiv.appendChild(pageJumpButtonContainer);
    rootContainer.appendChild(newElDiv);
  }
};
