import { Injectable } from '@angular/core';
import { Order, OrderChannel } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class ReceiptPrintService {
  printKitchenTicket(order: Order): void {
    const metadataHtml = this.buildMetadataHtml(order);
    const detailItemsHtml = this.buildDetailItemsHtml(order);
    const saucesHtml = this.buildSauceItemsHtml(order);
    const totalsHtml = this.buildTotalsHtml(order);

    const detailHtml = `
      <html>
        <head>
          <title>Comanda Black Sushi</title>
          <style>
            ${this.getBaseStyles()}
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="center">
              <div class="title">BLACK SUSHI</div>
              <div class="subtitle">Comanda de cocina</div>
            </div>

            <div class="divider"></div>

            ${metadataHtml}

            <div class="divider"></div>

            <div class="section-title">Detalle del pedido</div>
            ${detailItemsHtml}

            <div class="divider"></div>

            ${totalsHtml}

            <div class="divider"></div>

            <div class="footer">
              Black Sushi · Cocina
            </div>
          </div>

        </body>
      </html>
    `;

    const sauceHtml = `
      <html>
        <head>
          <title>Comanda Salsas Black Sushi</title>
          <style>
            ${this.getBaseStyles()}

            body.sauce-ticket {
              font-size: 13px;
            }

            .sauce-ticket .title {
              font-size: 20px;
            }

            .sauce-ticket .subtitle {
              font-size: 14px;
            }

            .sauce-ticket .section-title {
              font-size: 17px;
              text-align: center;
            }

            .sauce-ticket .customer-highlight {
              font-size: 16px;
              padding: 7px 8px;
            }

            .sauce-ticket .customer-highlight strong {
              display: block;
              margin-bottom: 2px;
              font-size: 11px;
            }

            .sauce-ticket .item {
              margin-bottom: 16px;
            }

            .sauce-ticket .item-row {
              grid-template-columns: 42px 1fr;
              font-size: 16px;
            }

            .sauce-ticket .qty {
              width: 40px;
            }

            .sauce-ticket .sauces {
              margin-left: 50px;
              margin-top: 6px;
              font-size: 20px;
              line-height: 1.3;
              font-weight: 800;
              word-break: break-word;
            }

            .sauce-ticket .sauce-list {
              padding-left: 24px;
            }

            .sauce-ticket .sauce-list li {
              margin-bottom: 4px;
            }
          </style>
        </head>
        <body class="sauce-ticket">
          <div class="ticket">
            <div class="center">
              <div class="title">BLACK SUSHI</div>
              <div class="subtitle">Comanda de salsas</div>
            </div>

            <div class="divider"></div>

            ${metadataHtml}

            <div class="divider"></div>

            <div class="section-title">Salsas del pedido</div>
            ${saucesHtml}

            <div class="divider"></div>

            <div class="footer">
              Black Sushi · Salsas
            </div>
          </div>

        </body>
      </html>
    `;

    this.printHtmlSequence([detailHtml, sauceHtml]);
  }

  private buildMetadataHtml(order: Order): string {
    const channelLabel = this.getChannelLabel(order.orderChannel);
    const tableLine = order.tableNumber
      ? `<div><strong>Mesa:</strong> ${order.tableNumber}</div>`
      : '';
    const customerLine = order.customerName
      ? `
        <div class="customer-highlight">
          <strong>Cliente</strong>
          <span>${order.customerName}</span>
        </div>
      `
      : '';
    const formattedDate = new Date(order.createdAt).toLocaleString('es-CL');

    return `
      <div class="meta">
        ${customerLine}
        <div><strong>Pedido:</strong> #${order.id.slice(-6)}</div>
        <div><strong>Tipo:</strong> ${order.orderType.toUpperCase()}</div>
        <div><strong>Canal:</strong> ${channelLabel}</div>
        ${tableLine}
        <div><strong>Fecha:</strong> ${formattedDate}</div>
        <div><strong>Estado:</strong> ${order.status.replaceAll('_', ' ').toUpperCase()}</div>
      </div>
    `;
  }

  private buildDetailItemsHtml(order: Order): string {
    return order.items
      .map((item) => {
        const descriptionHtml = item.description
          ? this.buildDescriptionHtml(item.description)
          : '';

        const extrasHtml = item.extras?.length
          ? `<div class="extras">+ ${item.extras
              .map((x) => `${x.name}${x.quantity > 1 ? ` x${x.quantity}` : ''}`)
              .join(', ')}</div>`
          : '';

        const saucesInlineHtml = item.sauces?.length
          ? `<div class="sauces">Salsas: ${item.sauces
              .map((sauce) => `${sauce.name}${sauce.quantity > 1 ? ` x${sauce.quantity}` : ''}`)
              .join(', ')}</div>`
          : '';

        const notesHtml = item.notes
          ? `<div class="notes">Nota: ${item.notes}</div>`
          : '';

        return `
          <div class="item">
            <div class="item-row">
              <span class="qty">${item.quantity}x</span>
              <span class="name">${item.name}</span>
              <span class="price">$${item.subtotal.toLocaleString('es-CL')}</span>
            </div>
            ${descriptionHtml}
            ${extrasHtml}
            ${saucesInlineHtml}
            ${notesHtml}
          </div>
        `;
      })
      .join('');
  }

  private buildDescriptionHtml(description: string): string {
    const parts = description
      .split(' + ')
      .map((item) => item.trim())
      .filter(Boolean);

    if (parts.length <= 1) {
      return `<div class="item-description">${description}</div>`;
    }

    return `
      <ul class="item-description description-list">
        ${parts.map((item) => `<li>${item}</li>`).join('')}
      </ul>
    `;
  }

  private buildSauceItemsHtml(order: Order): string {
    const sauceItems = order.items.filter((item) => (item.sauces?.length ?? 0) > 0);

    if (!sauceItems.length) {
      return '<div class="notes">Sin salsas seleccionadas.</div>';
    }

    return sauceItems
      .map(
        (item) => `
          <div class="item sauce-item">
            <div class="item-row sauce-row">
              <span class="qty">${item.quantity}x</span>
              <span class="name">${item.name}</span>
            </div>
            <ul class="sauces sauce-list">${(item.sauces ?? [])
              .map(
                (sauce) =>
                  `<li>${sauce.name}${sauce.quantity > 1 ? ` x${sauce.quantity}` : ''}</li>`
              )
              .join('')}</ul>
          </div>
        `
      )
      .join('');
  }

  private buildTotalsHtml(order: Order): string {
    const deliveryHtml = order.deliveryFee && order.deliveryFee > 0
      ? `
        <div class="total-line">
          <span>Delivery</span>
          <span>$${order.deliveryFee.toLocaleString('es-CL')}</span>
        </div>
      `
      : '';
    const productsSubtotal = order.total - (order.deliveryFee ?? 0);

    return `
      <div class="totals">
        <div class="total-line">
          <span>Subtotal productos</span>
          <span>$${productsSubtotal.toLocaleString('es-CL')}</span>
        </div>

        ${deliveryHtml}

        <div class="grand-total">
          <span>Total final</span>
          <span>$${order.total.toLocaleString('es-CL')}</span>
        </div>
      </div>
    `;
  }

  private getChannelLabel(channel: OrderChannel): string {
    const channelLabelMap: Record<OrderChannel, string> = {
      mesa: 'Mesa',
      retiro: 'Retiro',
      delivery: 'Delivery',
      uber_eats: 'Uber Eats',
      pedidos_ya: 'PedidosYa',
      rappi: 'Rappi'
    };

    return channelLabelMap[channel];
  }

  private getBaseStyles(): string {
    return `
      @page {
        size: 80mm auto;
        margin: 0;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 8mm 5mm 6mm;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 11px;
        color: #000;
        width: 80mm;
        max-width: 80mm;
        overflow-wrap: break-word;
        word-break: break-word;
      }

      .ticket {
        width: 100%;
        max-width: 70mm;
        margin: 0 auto;
      }

      .center {
        text-align: center;
      }

      .title {
        font-size: 17px;
        font-weight: bold;
        margin-bottom: 4px;
        letter-spacing: 0.4px;
      }

      .subtitle {
        font-size: 11px;
        margin-bottom: 12px;
      }

      .divider {
        border-top: 1px dashed #000;
        margin: 8px 0;
      }

      .meta {
        margin-bottom: 8px;
        line-height: 1.4;
        font-size: 10px;
      }

      .customer-highlight {
        margin: 6px 0;
        padding: 6px 8px;
        border: 1px solid #000;
        border-radius: 6px;
        background: #f5f5f5;
        font-size: 13px;
        font-weight: 800;
        line-height: 1.2;
      }

      .customer-highlight strong {
        display: inline-block;
        margin-right: 4px;
        font-size: 10px;
        text-transform: uppercase;
      }

      .item {
        margin-bottom: 8px;
      }

      .item-row {
        display: grid;
        grid-template-columns: 26px minmax(0, 1fr) auto;
        gap: 6px;
        font-weight: bold;
        align-items: start;
      }

      .qty {
        width: 24px;
      }

      .name {
        min-width: 0;
        line-height: 1.25;
      }

      .price {
        white-space: nowrap;
        text-align: right;
        font-size: 10px;
      }

      .extras,
      .item-description,
      .notes,
      .sauces {
        margin-left: 32px;
        margin-top: 2px;
        font-size: 10px;
        line-height: 1.25;
      }

      .item-description {
        margin-bottom: 2px;
        color: #222;
      }

      .description-list {
        margin-bottom: 4px;
        padding-left: 18px;
      }

      .description-list li {
        margin-bottom: 2px;
      }

      .notes {
        font-style: italic;
      }

      .sauce-list {
        margin-bottom: 0;
        padding-left: 18px;
      }

      .sauce-list li {
        margin-bottom: 2px;
      }

      .section-title {
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 8px;
      }

      .sauce-item {
        margin-bottom: 8px;
      }

      .sauce-row {
        grid-template-columns: 26px minmax(0, 1fr);
      }

      .totals {
        margin-top: 10px;
        font-size: 10px;
      }

      .total-line {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 6px;
      }

      .grand-total {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        font-size: 12px;
        font-weight: bold;
        margin-top: 8px;
      }

      .footer {
        margin-top: 12px;
        text-align: center;
        font-size: 10px;
      }
    `;
  }

  private printHtmlSequence(documents: string[]): void {
    const queue = [...documents];

    const printNext = (): void => {
      const html = queue.shift();
      if (!html) {
        return;
      }

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const frameWindow = iframe.contentWindow;
      const frameDocument = iframe.contentDocument;

      if (!frameWindow || !frameDocument) {
        iframe.remove();
        alert('No se pudo preparar la impresion de la comanda.');
        return;
      }

      const cleanup = () => {
        iframe.remove();
        if (queue.length) {
          setTimeout(() => {
            printNext();
          }, 250);
        }
      };

      frameWindow.onafterprint = cleanup;

      frameDocument.open();
      frameDocument.write(html);
      frameDocument.close();

      setTimeout(() => {
        frameWindow.focus();
        frameWindow.print();

        setTimeout(() => {
          if (document.body.contains(iframe)) {
            cleanup();
          }
        }, 1500);
      }, 150);
    };

    printNext();
  }
}
