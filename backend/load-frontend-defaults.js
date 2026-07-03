const fs = require('fs');
const path = require('path');
const vm = require('vm');

function readExportExpression(filePath, exportName) {
  const source = fs.readFileSync(filePath, 'utf8');
  const exportIndex = source.indexOf(`export const ${exportName}`);

  if (exportIndex === -1) {
    throw new Error(`No se encontro export const ${exportName} en ${filePath}`);
  }

  const startToken = source.indexOf('=', exportIndex);
  const expressionStart = source.indexOf('[', startToken);
  const expressionEnd = source.indexOf('];', expressionStart);

  if (expressionStart === -1 || expressionEnd === -1) {
    throw new Error(`No se pudo leer el arreglo ${exportName} desde ${filePath}`);
  }

  return source.slice(expressionStart, expressionEnd + 1);
}

function evaluateArray(expression) {
  const script = new vm.Script(`(${expression})`);
  const result = script.runInNewContext({});

  if (!Array.isArray(result)) {
    throw new Error('La expresión evaluada no devolvio un arreglo.');
  }

  return result;
}

function loadFrontendProducts() {
  const filePath = path.resolve(__dirname, '../src/app/core/data/products.ts');
  return evaluateArray(readExportExpression(filePath, 'PRODUCTS'));
}

function loadFrontendExtras() {
  const filePath = path.resolve(__dirname, '../src/app/core/data/menu-options.ts');
  return evaluateArray(readExportExpression(filePath, 'EXTRA_OPTIONS'));
}

function loadFrontendTables() {
  const filePath = path.resolve(__dirname, '../src/app/core/data/order-channels.ts');
  return evaluateArray(readExportExpression(filePath, 'TABLES'));
}

module.exports = {
  loadFrontendProducts,
  loadFrontendExtras,
  loadFrontendTables
};
