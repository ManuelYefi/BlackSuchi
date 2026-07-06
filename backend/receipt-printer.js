const { spawn } = require('child_process');

const PRINTER_NAME = process.env.RECEIPT_PRINTER_NAME || 'Printer_POS_80';
const LINE_WIDTH = Number(process.env.RECEIPT_LINE_WIDTH || 48);

function printKitchenTicket(order, options = {}) {
  const jobs = [];
  const ticketType = options.ticketType || 'all';

  if (ticketType === 'all' || ticketType === 'detail') {
    jobs.push(buildDetailTicket(order));
  }

  if (ticketType === 'sauces' || (ticketType === 'all' && hasSauceTicketContent(order))) {
    jobs.push(buildSauceTicket(order));
  }

  return jobs.reduce(
    (chain, ticket) => chain.then(() => sendRawToPrinter(ticket)),
    Promise.resolve()
  );
}

function sendRawToPrinter(buffer) {
  return new Promise((resolve, reject) => {
    const printer = spawn('lpr', ['-P', PRINTER_NAME, '-o', 'raw'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stderr = '';

    printer.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    printer.on('error', reject);
    printer.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `lpr termino con codigo ${code}`));
    });

    printer.stdin.end(buffer);
  });
}

function buildDetailTicket(order) {
  const lines = [
    { text: 'BLACK SUSHI', align: 'center', bold: true, size: 'double' },
    { text: 'COMANDA DE COCINA', align: 'center', bold: true },
    { text: '' },
    ...metadataLines(order),
    { text: separator('=') },
    { text: 'DETALLE DEL PEDIDO', bold: true },
    { text: separator('-') },
    ...itemLines(order),
    { text: separator('=') },
    ...totalLines(order),
    { text: separator('-') },
    { text: 'Black Sushi - Cocina', align: 'center' }
  ];

  return escposDocument(lines);
}

function buildSauceTicket(order) {
  const lines = [
    { text: 'BLACK SUSHI', align: 'center', bold: true, size: 'double' },
    { text: 'COMANDA DE SALSAS', align: 'center', bold: true },
    { text: '' },
    ...metadataLines(order),
    { text: separator('=') },
    { text: 'SALSAS DEL PEDIDO', align: 'center', bold: true },
    { text: separator('-') },
    ...sauceLines(order),
    { text: separator('-') },
    { text: 'Black Sushi - Salsas', align: 'center' }
  ];

  return escposDocument(lines);
}

function escposDocument(lines) {
  return Buffer.concat([
    printerReset(),
    ...lines.flatMap((line) => escposLine(line)),
    normalText(),
    Buffer.from('\n', 'ascii'),
    Buffer.from('\x1dV\x42\x00', 'binary')
  ]);
}

function printerReset() {
  return Buffer.from('\x1b@\x1bt\x00\x1b!\x00\x1d!\x00\x1bM\x00\x1b2\x1ba\x00', 'binary');
}

function normalText() {
  return Buffer.from('\x1b!\x00\x1d!\x00\x1ba\x00', 'binary');
}

function escposLine(line) {
  const options = typeof line === 'string' ? { text: line } : line;
  const text = options.size === 'double' ? toPrinterText(options.text).slice(0, 24) : toPrinterText(options.text);
  const align = options.align === 'center' ? '\x1ba\x01' : options.align === 'right' ? '\x1ba\x02' : '\x1ba\x00';
  const size = options.size === 'double' ? '\x1d!\x11' : '\x1d!\x00';
  const bold = options.bold ? '\x1bE\x01' : '\x1bE\x00';

  return [
    normalText(),
    Buffer.from(`${align}${size}${bold}`, 'binary'),
    Buffer.from(`${text}\n`, 'ascii'),
    normalText()
  ];
}

function metadataLines(order) {
  const lines = [];

  if (order.customerName) {
    lines.push({ text: 'CLIENTE', align: 'center', bold: true });
    lines.push({ text: order.customerName, align: 'center', bold: true });
    lines.push('');
  }

  lines.push(`Pedido: #${String(order.id || '').slice(-6)}`);
  lines.push(`Tipo: ${String(order.orderType || '').toUpperCase()}`);
  lines.push(`Canal: ${getChannelLabel(order.orderChannel)}`);

  if (order.tableNumber) {
    lines.push(`Mesa: ${order.tableNumber}`);
  }

  if (order.chopsticksCount !== undefined) {
    lines.push(`Palitos: ${order.chopsticksCount > 0 ? order.chopsticksCount : 'Sin palitos'}`);
  }

  lines.push(`Fecha: ${new Date(order.createdAt).toLocaleString('es-CL')}`);
  lines.push(`Estado: ${String(order.status || '').replaceAll('_', ' ').toUpperCase()}`);

  return lines.flatMap((line) => {
    if (typeof line !== 'string') {
      return line;
    }

    return wrapLine(line).map((text) => ({ text }));
  });
}

function itemLines(order) {
  return (order.items || []).flatMap((item) => {
    const printableItem = getPrintableItemParts(item);
    const lines = [
      { text: `${item.quantity}x ${toPrinterText(printableItem.name)}`, bold: true },
      amountLine('Subtotal item', item.subtotal)
    ];

    if (printableItem.description) {
      lines.push(...wrapLine(`  ${printableItem.description}`).map((text) => ({ text })));
    }

    if (item.extras?.length) {
      lines.push(
        ...wrapLine(
          `  + ${item.extras
            .map((extra) => `${extra.name}${extra.quantity > 1 ? ` x${extra.quantity}` : ''}`)
            .join(', ')}`
        ).map((text) => ({ text }))
      );
    }

    if (item.notes) {
      lines.push(...wrapLine(`  Nota: ${item.notes}`).map((text) => ({ text })));
    }

    lines.push({ text: '' });
    return lines;
  });
}

function sauceLines(order) {
  if (order.sauces?.length) {
    return [
      `${totalItemQuantity(order)}x Pedido completo`,
      ...order.sauces.map((sauce) => `  - ${sauce.name}${sauce.quantity > 1 ? ` x${sauce.quantity}` : ''}`)
    ].flatMap((line) => wrapLine(line).map((text) => ({ text })));
  }

  const itemSauceLines = (order.items || [])
    .filter((item) => (item.sauces?.length ?? 0) > 0)
    .flatMap((item) => [
      ...wrapLine(`${item.quantity}x ${item.name}`).map((text) => ({ text })),
      ...(item.sauces || []).flatMap((sauce) =>
        wrapLine(`  - ${sauce.name}${sauce.quantity > 1 ? ` x${sauce.quantity}` : ''}`).map((text) => ({ text }))
      ),
      { text: '' }
    ]);

  return itemSauceLines.length
    ? itemSauceLines
    : [
        { text: 'SIN SALSAS INGRESADAS', align: 'center', bold: true },
        { text: 'Revisar antes de preparar.', align: 'center' }
      ];
}

function totalLines(order) {
  const deliveryFee = order.deliveryFee ?? 0;
  const sauceCharge = order.sauceCharge ?? 0;
  const productsSubtotal = order.total - deliveryFee - sauceCharge;
  const lines = [amountLine('Subtotal productos', productsSubtotal)];

  if (deliveryFee > 0) {
    lines.push(amountLine('Delivery', deliveryFee));
  }

  if (sauceCharge > 0) {
    lines.push(amountLine('Salsas', sauceCharge));
  }

  lines.push({ ...amountLine('Total final', order.total), bold: true });
  return lines;
}

function getPrintableItemParts(item) {
  if (!item.description) {
    return { name: item.name };
  }

  const match = item.description.match(/^([^.(]+(?:\s+en\s+[^.]+)?)\.\s+(.+)$/i);

  if (!match || match[2].includes(' + ')) {
    return {
      name: item.name,
      description: item.description
    };
  }

  return {
    name: match[1].trim(),
    description: match[2].trim()
  };
}

function hasSauceTicketContent(order) {
  return Boolean(order.sauces?.length || (order.items || []).some((item) => (item.sauces?.length ?? 0) > 0));
}

function totalItemQuantity(order) {
  return (order.items || []).reduce((sum, item) => sum + item.quantity, 0);
}

function amountLine(label, amount) {
  const price = `$${Number(amount || 0).toLocaleString('es-CL')}`;
  const cleanLabel = toPrinterText(label);
  const spaces = Math.max(1, LINE_WIDTH - cleanLabel.length - price.length);
  return { text: `${cleanLabel}${' '.repeat(spaces)}${price}` };
}

function wrapLine(value) {
  const words = toPrinterText(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (candidate.length <= LINE_WIDTH) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [''];
}

function separator(character = '-') {
  return character.repeat(LINE_WIDTH);
}

function toPrinterText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '')
    .trimEnd();
}

function getChannelLabel(channel) {
  const labels = {
    mesa: 'Mesa',
    retiro: 'Retiro',
    delivery: 'Delivery',
    uber_eats: 'Uber Eats',
    pedidos_ya: 'PedidosYa',
    rappi: 'Rappi'
  };

  return labels[channel] || channel || '';
}

module.exports = {
  printKitchenTicket
};
