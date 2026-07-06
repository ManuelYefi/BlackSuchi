import { Injectable } from '@angular/core';
import { Order, OrderChannel } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class ReceiptPrintService {
  private readonly receiptPaperWidthMm = 72;
  private readonly receiptPaperHeightMm = 210;
  private readonly receiptContentWidthMm = 68;
  private readonly receiptBodyPaddingMm = 2;

  printKitchenTicket(order: Order): void {
    void this.printKitchenTicketHtml(order);
  }

  private async printKitchenTicketHtml(order: Order): Promise<void> {
    const metadataHtml = this.buildMetadataHtml(order);
    const detailItemsHtml = this.buildDetailItemsHtml(order);
    const hasSauceTicket = this.hasSauceTicketContent(order);
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

    try {
      await this.printHtmlDocument(detailHtml);

      if (hasSauceTicket) {
        await this.printHtmlDocument(sauceHtml);
      }
    } catch (error) {
      console.error('[receipt-print-service] html print failed', error);
      alert('No se pudo preparar la impresion de la comanda.');
    }
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
    const chopsticksLine = order.chopsticksCount !== undefined
      ? `<div><strong>Palitos:</strong> ${order.chopsticksCount > 0 ? order.chopsticksCount : 'Sin palitos'}</div>`
      : '';

    return `
      <div class="meta">
        ${customerLine}
        <div><strong>Pedido:</strong> #${order.id.slice(-6)}</div>
        <div><strong>Tipo:</strong> ${order.orderType.toUpperCase()}</div>
        <div><strong>Canal:</strong> ${channelLabel}</div>
        ${tableLine}
        ${chopsticksLine}
        <div><strong>Fecha:</strong> ${formattedDate}</div>
        <div><strong>Estado:</strong> ${order.status.replaceAll('_', ' ').toUpperCase()}</div>
      </div>
    `;
  }

  private buildDetailItemsHtml(order: Order): string {
    return order.items
      .map((item) => {
        const printableItem = this.getPrintableItemParts(item);
        const descriptionHtml = printableItem.description
          ? this.buildDescriptionHtml(printableItem.description, item)
          : '';

        const extrasHtml = item.extras?.length
          ? `<div class="extras">+ ${item.extras
              .map((x) => `${x.name}${x.quantity > 1 ? ` x${x.quantity}` : ''}`)
              .join(', ')}</div>`
          : '';

        const notesHtml = item.notes
          ? `<div class="notes">Nota: ${item.notes}</div>`
          : '';

        return `
          <div class="item">
            <div class="item-row">
              <span class="qty">${item.quantity}x</span>
              <span class="name">${printableItem.name}</span>
              <span class="price">$${item.subtotal.toLocaleString('es-CL')}</span>
            </div>
            ${descriptionHtml}
            ${extrasHtml}
            ${notesHtml}
          </div>
        `;
      })
      .join('');
  }

  private getPrintableItemParts(item: Order['items'][number]): {
    name: string;
    description?: string;
  } {
    if (!item.description) {
      return { name: item.name };
    }

    const singleRollDescription = this.parseSingleRollDescription(item.description);

    if (!singleRollDescription) {
      return {
        name: item.name,
        description: item.description
      };
    }

    return {
      name: singleRollDescription.title,
      description: singleRollDescription.detail
    };
  }

  private buildDescriptionHtml(description: string, item: Order['items'][number]): string {
    const parts = description
      .split(' + ')
      .map((item) => item.trim())
      .filter(Boolean);

    if (parts.length <= 1) {
      return `<div class="item-description">${this.highlightChangedDescription(description, item)}</div>`;
    }

    return `
      <ul class="item-description description-list">
        ${parts.map((part) => `<li>${this.highlightChangedDescription(part, item)}</li>`).join('')}
      </ul>
    `;
  }

  private parseSingleRollDescription(description: string): {
    title: string;
    detail: string;
  } | null {
    const match = description.match(/^([^.(]+(?:\s+en\s+[^.]+)?)\.\s+(.+)$/i);

    if (!match) {
      return null;
    }

    const title = match[1].trim();
    const detail = match[2].trim();

    if (!title || !detail || detail.includes(' + ')) {
      return null;
    }

    return { title, detail };
  }

  private highlightChangedDescription(description: string, item: Order['items'][number]): string {
    const addedExtras = this.getAddedIngredientNames(item);
    const originalProtein = this.getOriginalProteinFromName(item.name);

    return description
      .split(',')
      .map((part, index) => {
        const trimmed = part.trim();
        const normalized = this.normalizeText(trimmed);
        const isAddedExtra = addedExtras.some((extra) => this.normalizeText(extra) === normalized);
        const isChangedProtein =
          index === 0 &&
          originalProtein.length > 0 &&
          normalized !== this.normalizeText(originalProtein);

        return isAddedExtra || isChangedProtein ? `<strong>${trimmed}</strong>` : trimmed;
      })
      .join(', ');
  }

  private getAddedIngredientNames(item: Order['items'][number]): string[] {
    return (item.extras ?? [])
      .filter((extra) => extra.type === 'extra')
      .map((extra) => extra.name.replace(/\s+(Roll|\d+\s+(?:cortes?|piezas?|rolls?))$/i, '').trim())
      .filter(Boolean);
  }

  private getOriginalProteinFromName(name: string): string {
    const proteins = [
      'Camarón apanado',
      'Pollo',
      'Kanikama',
      'Camarón',
      'Salmón',
      'Carne',
      'Atún',
      'Pulpo'
    ];

    return proteins.find((protein) => this.normalizeText(name).includes(this.normalizeText(protein))) ?? '';
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private buildSauceItemsHtml(order: Order): string {
    if (order.sauces?.length) {
      return `
        <div class="item sauce-item">
          <div class="item-row sauce-row">
            <span class="qty">${order.items.reduce((sum, item) => sum + item.quantity, 0)}x</span>
            <span class="name">Pedido completo</span>
          </div>
          <ul class="sauces sauce-list">${order.sauces
            .map(
              (sauce) =>
                `<li>${sauce.name}${sauce.quantity > 1 ? ` x${sauce.quantity}` : ''}</li>`
            )
            .join('')}</ul>
        </div>
      `;
    }

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

  private hasSauceTicketContent(order: Order): boolean {
    return Boolean(order.sauces?.length || order.items.some((item) => (item.sauces?.length ?? 0) > 0));
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
    const sauceHtml = order.sauceCharge && order.sauceCharge > 0
      ? `
        <div class="total-line">
          <span>Salsas</span>
          <span>$${order.sauceCharge.toLocaleString('es-CL')}</span>
        </div>
      `
      : '';
    const productsSubtotal = order.total - (order.deliveryFee ?? 0) - (order.sauceCharge ?? 0);

    return `
      <div class="totals">
        <div class="total-line">
          <span>Subtotal productos</span>
          <span>$${productsSubtotal.toLocaleString('es-CL')}</span>
        </div>

        ${deliveryHtml}
        ${sauceHtml}

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
        margin: 0;
        size: ${this.receiptPaperWidthMm}mm ${this.receiptPaperHeightMm}mm;
      }

      @media print {
        html,
        body {
          margin: 0 !important;
          padding: ${this.receiptBodyPaddingMm}mm !important;
          overflow: hidden !important;
          background: #fff !important;
          width: ${this.receiptPaperWidthMm}mm !important;
          height: ${this.receiptPaperHeightMm}mm !important;
        }

        .ticket {
          width: ${this.receiptContentWidthMm}mm !important;
          max-width: none !important;
          margin: 0 !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          transform-origin: top left !important;
          transform: scale(var(--ticket-scale, 1)) !important;
        }
      }

      * {
        box-sizing: border-box;
      }

      html {
        background: #fff;
        width: ${this.receiptPaperWidthMm}mm;
        height: ${this.receiptPaperHeightMm}mm;
      }

      body {
        margin: 0;
        padding: ${this.receiptBodyPaddingMm}mm;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        color: #000;
        overflow-wrap: break-word;
        word-break: break-word;
        background: #fff;
        width: ${this.receiptPaperWidthMm}mm;
        min-height: ${this.receiptPaperHeightMm}mm;
      }

      .ticket {
        width: ${this.receiptContentWidthMm}mm;
        max-width: none;
        margin: 0;
      }

      .center {
        text-align: center;
      }

      .title {
        font-size: 19px;
        font-weight: bold;
        margin-bottom: 3px;
        letter-spacing: 0.4px;
      }

      .subtitle {
        font-size: 12px;
        margin-bottom: 9px;
      }

      .divider {
        border-top: 1px dashed #000;
        margin: 7px 0;
      }

      .meta {
        margin-bottom: 7px;
        line-height: 1.4;
        font-size: 12px;
      }

      .customer-highlight {
        margin: 6px 0;
        padding: 6px 8px;
        border: 1px solid #000;
        border-radius: 6px;
        background: #f5f5f5;
        font-size: 14px;
        font-weight: 800;
        line-height: 1.2;
      }

      .customer-highlight strong {
        display: inline-block;
        margin-right: 4px;
        font-size: 11px;
        text-transform: uppercase;
      }

      .item {
        margin-bottom: 9px;
      }

      .item-row {
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr) auto;
        gap: 6px;
        font-weight: bold;
        align-items: start;
        font-size: 12px;
      }

      .qty {
        width: 26px;
      }

      .name {
        min-width: 0;
        line-height: 1.25;
      }

      .price {
        white-space: nowrap;
        text-align: right;
        font-size: 11px;
      }

      .extras,
      .item-description,
      .notes,
      .sauces {
        margin-left: 34px;
        margin-top: 3px;
        font-size: 11px;
        line-height: 1.35;
      }

      .item-description {
        margin-bottom: 2px;
        color: #222;
      }

      .description-list {
        margin-bottom: 4px;
        padding-left: 16px;
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
        font-size: 13px;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 8px;
      }

      .sauce-item {
        margin-bottom: 8px;
      }

      .sauce-row {
        grid-template-columns: 28px minmax(0, 1fr);
      }

      .totals {
        margin-top: 10px;
        font-size: 11px;
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

  private printHtmlDocument(html: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-10000px';
      iframe.style.top = '0';
      iframe.style.width = `${this.receiptPaperWidthMm}mm`;
      iframe.style.height = '1000px';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const frameWindow = iframe.contentWindow;
      const frameDocument = iframe.contentDocument;

      if (!frameWindow || !frameDocument) {
        iframe.remove();
        reject(new Error('No se pudo preparar la impresion de la comanda.'));
        return;
      }

      const cleanup = () => {
        iframe.remove();
        resolve();
      };

      frameWindow.onafterprint = cleanup;

      frameDocument.open();
      frameDocument.write(html);
      frameDocument.close();

      setTimeout(() => {
        this.applyMeasuredPageSize(frameDocument);
        frameWindow.focus();
        frameWindow.print();

        setTimeout(() => {
          if (document.body.contains(iframe)) {
            cleanup();
          }
        }, 1500);
      }, 150);
    });
  }

  private applyMeasuredPageSize(frameDocument: Document): void {
    const ticket = frameDocument.querySelector<HTMLElement>('.ticket');
    const body = frameDocument.body;

    if (!ticket || !body) {
      return;
    }

    const ticketHeightPx = Math.max(ticket.scrollHeight, ticket.getBoundingClientRect().height);
    const pxPerMm = this.getPixelsPerMillimeter(frameDocument);
    const availableHeightMm = this.receiptPaperHeightMm - this.receiptBodyPaddingMm * 2;
    const availableHeightPx = availableHeightMm * pxPerMm;
    const scale = ticketHeightPx > 0 ? Math.min(1, availableHeightPx / ticketHeightPx) : 1;
    const safeScale = Number.isFinite(scale) && scale > 0 ? Math.floor(scale * 100) / 100 : 1;
    const pageSizeStyle = frameDocument.createElement('style');

    pageSizeStyle.textContent = `
      @page {
        margin: 0;
        size: ${this.receiptPaperWidthMm}mm ${this.receiptPaperHeightMm}mm;
      }

      html,
      body {
        width: ${this.receiptPaperWidthMm}mm !important;
        height: ${this.receiptPaperHeightMm}mm !important;
        min-height: ${this.receiptPaperHeightMm}mm !important;
        overflow: hidden !important;
      }

      .ticket {
        --ticket-scale: ${safeScale};
      }
    `;

    frameDocument.head.appendChild(pageSizeStyle);
  }

  private getPixelsPerMillimeter(frameDocument: Document): number {
    const probe = frameDocument.createElement('div');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.width = '100mm';
    probe.style.height = '1mm';
    frameDocument.body.appendChild(probe);

    const pixelsPerMillimeter = probe.getBoundingClientRect().width / 100;
    probe.remove();

    return pixelsPerMillimeter || 3.78;
  }
}
