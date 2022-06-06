import React, { useEffect, useState, useRef } from 'react';
import Spreadsheet from 'x-data-spreadsheet';
import XLSX from 'xlsx';
import InputFile from './InputFile';

function spreadsheetToData(workBook) {
  var out = [];
  workBook.SheetNames.forEach(function (name) {
    var o = { name: name, rows: {} };
    var workSheet = workBook.Sheets[name];
    var arrayOfArray = XLSX.utils.sheet_to_json(workSheet, {
      raw: false,
      header: 1,
    });
    arrayOfArray.forEach(function (r, i) {
      var cells = {};
      r.forEach(function (c, j) {
        cells[j] = { text: c };
      });
      o.rows[i] = { cells: cells };
    });
    out.push(o);
  });
  return out;
}

function dataToSpreadsheet(spreadsheetData) {
  var out = XLSX.utils.book_new();
  spreadsheetData.forEach(function (xws) {
    var arrayOfArray = [[]];
    var rowobj = xws.rows;
    for (var ri = 0; ri < rowobj.len; ++ri) {
      var row = rowobj[ri];
      if (!row) continue;
      arrayOfArray[ri] = [];
      Object.keys(row.cells).forEach(function (k) {
        var idx = +k;
        if (isNaN(idx)) return;
        arrayOfArray[ri][idx] = row.cells[k].text;
      });
    }
    var ws = XLSX.utils.aoa_to_sheet(arrayOfArray);
    XLSX.utils.book_append_sheet(out, ws, xws.name);
  });
  return out;
}

export default function App() {
  const xSpreadSheet = useRef(null);
  const exportButton = useRef(null);
  const readAsBinaryStringCheckBox = useRef(null);
  const [readAsBinaryString, setReadAsBinaryString] = useState(() => {
    const rABS =
      typeof FileReader !== 'undefined' &&
      (FileReader.prototype || {}).readAsBinaryString;
    return rABS ? true : false;
  });

  const [data, setData] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  useEffect(() => {
    function readWorkBook(files) {
      const f = files[0];
      const reader = new FileReader();
      if (readAsBinaryString) {
        reader.readAsBinaryString(f);
      } else {
        reader.readAsArrayBuffer(f);
      }
      reader.onload = function (e) {
        if (typeof console !== 'undefined')
          console.log('onload', new Date(), readAsBinaryString);
        let result = e.target.result;
        if (!readAsBinaryString) {
          result = new Uint8Array(result);
        }

        result = spreadsheetToData(
          XLSX.read(result, {
            type: readAsBinaryString ? 'binary' : 'array',
          })
        );
        setData(() => result);
      };
    }

    if (uploadedFile) {
      readWorkBook(uploadedFile);
    }
  }, [uploadedFile]);

  const onChange = (e) => {
    setReadAsBinaryString(e.target.checked);
  };

  // const onFileUpload = (e) => {};

  function export_xlsx() {
    var new_wb = dataToSpreadsheet(xSpreadSheet.current.getData());
    console.log(new_wb);
    /* write file and trigger a download */
    XLSX.writeFile(new_wb, 'sheetjs.xlsx', {});
  }

  /* update x-spreadsheet */
  useEffect(() => {
    if (data) {
      const xspr = new Spreadsheet(xSpreadSheet.current);
      xspr.loadData(data);
      // exportButton.current.disabled = false;
    }
    console.log('output', data);
  }, [data]);

  return (
    <div>
      <br />
      <InputFile setUploadedFile={setUploadedFile} />

      <b>{'Advanced  Options:'}</b>
      <div>{'Use readAsBinaryString: (when available) '}</div>

      <input
        type="checkbox"
        name="userabs"
        defaultValue={readAsBinaryString}
        onChange={onChange}
        ref={readAsBinaryStringCheckBox}
      />

      <div id="htmlout" ref={xSpreadSheet}></div>
      <br />
    </div>
  );
}
