/* eslint-disable react/prop-types */

// tickets/shared.js
import { gql } from "@apollo/client";
import React from "react";

// ─── GQL ─────────────────────────────────────────────────────────────────────

export const GET_EVENTS = gql`
  query GetEventsT {
    getEventsT {
      id
      name
      date
      description
      ticketLimit
      totalTickets
      raffleEnabled
      price
    }
  }
`;

export const GET_TICKETS = gql`
  query GetTickets($eventId: ID, $status: TicketStatus) {
    getTickets(eventId: $eventId, status: $status) {
      id
      source
      userId {
        id
        name
        firstSurName
        secondSurName
        email
      }
      type
      status
      paid
      amountPaid
      ticketQuantity
      scans
      buyerName
      buyerEmail
      externalTicketNumbers
      raffleNumbers
      createdAt
    }
  }
`;

export const GET_MY_TICKETS = gql`
  query GetMyTickets {
    getMyTickets {
      id
      eventId
      source
      userId {
        id
        name
        firstSurName
        secondSurName
        email
      }
      type
      status
      paid
      amountPaid
      ticketQuantity
      scans
      qrCode
      buyerName
      buyerEmail
      raffleNumbers
      createdAt
    }
  }
`;

export const GET_EVENT_STATS = gql`
  query GetEventStats($eventId: ID!) {
    getEventStats(eventId: $eventId) {
      eventId
      eventName
      capacity
      totalIssued
      totalPaid
      totalCollected
      totalPending
      totalCheckedIn
      totalPartially
      totalUsed
      totalCancelled
      remaining
    }
  }
`;

export const VALIDATE_TICKET = gql`
  mutation ValidateTicket($qrPayload: String!, $location: String) {
    validateTicket(qrPayload: $qrPayload, location: $location) {
      result
      canEnter
      message
      totalDue
      balanceDue
      canMarkPaid
      ticket {
        id
        paid
        status
        type
        ticketQuantity
        scans
        buyerName
        buyerEmail
        amountPaid
        raffleNumbers
        userId {
          name
          firstSurName
          secondSurName
          email
        }
      }
    }
  }
`;

export const SETTLE_TICKET_PAYMENT = gql`
  mutation SettleTicketPayment($ticketId: ID!) {
    settleTicketPayment(ticketId: $ticketId) {
      id
      paid
      amountPaid
      status
      scans
      ticketQuantity
    }
  }
`;

export const UPDATE_PAYMENT = gql`
  mutation UpdatePaymentStatus($ticketId: ID!, $amountPaid: Float!) {
    updatePaymentStatus(ticketId: $ticketId, amountPaid: $amountPaid) {
      id
      paid
      amountPaid
      status
    }
  }
`;

export const ASSIGN_TICKETS = gql`
  mutation AssignTickets($input: TicketInput!) {
    assignTickets(input: $input) {
      id
      type
      status
      ticketQuantity
      qrCode
      userId {
        name
        firstSurName
        secondSurName
        email
      }
    }
  }
`;

export const ASSIGN_BULK = gql`
  mutation AssignTicketsBulk($input: AssignBulkInput!) {
    assignTicketsBulk(input: $input) {
      succeeded {
        id
        buyerName
        buyerEmail
        ticketQuantity
        status
      }
      failed
      total
    }
  }
`;

export const PURCHASE_TICKET = gql`
  mutation PurchaseTicket(
    $eventId: ID!
    $buyerName: String!
    $buyerEmail: String!
    $ticketQuantity: Int!
  ) {
    purchaseTicket(
      eventId: $eventId
      buyerName: $buyerName
      buyerEmail: $buyerEmail
      ticketQuantity: $ticketQuantity
    ) {
      id
      type
      status
      ticketQuantity
      qrCode
      buyerName
      buyerEmail
    }
  }
`;

export const SEND_COURTESY = gql`
  mutation SendCourtesyTicket(
    $eventId: ID!
    $buyerName: String!
    $buyerEmail: String!
    $ticketQuantity: Int!
  ) {
    sendCourtesyTicket(
      eventId: $eventId
      buyerName: $buyerName
      buyerEmail: $buyerEmail
      ticketQuantity: $ticketQuantity
    ) {
      id
      type
      status
      ticketQuantity
      qrCode
      buyerName
      buyerEmail
    }
  }
`;

export const IMPORT_TICKETS_FROM_EXCEL = gql`
  mutation ImportTicketsFromExcel($input: TicketExcelImportInput!) {
    importTicketsFromExcel(input: $input) {
      totalRows
      groupedRecipients
      createdTickets
      updatedTickets
      emailsSent
      fullyPaidRecipients
      partialRecipients
      pendingRecipients
      invalidRows
      failedRows
    }
  }
`;

export const ADD_IMPORTED_TICKET_RECIPIENT = gql`
  mutation AddImportedTicketRecipient($input: ImportedTicketManualInput!) {
    addImportedTicketRecipient(input: $input) {
      id
      source
      status
      paid
      ticketQuantity
      buyerName
      buyerEmail
      externalTicketNumbers
    }
  }
`;

export const RESEND_IMPORTED_TICKET_EMAIL = gql`
  mutation ResendImportedTicketEmail($ticketId: ID!) {
    resendImportedTicketEmail(ticketId: $ticketId)
  }
`;

export const CANCEL_TICKET = gql`
  mutation CancelTicket($ticketId: ID!, $reason: String, $cancelledBy: ID) {
    cancelTicket(ticketId: $ticketId, reason: $reason, cancelledBy: $cancelledBy) {
      id
      status
      cancelledAt
      notes
      scans
      ticketQuantity
      buyerName
      buyerEmail
      userId {
        id
        name
        firstSurName
        secondSurName
        email
      }
    }
  }
`;

export const DELETE_TICKET = gql`
  mutation DeleteTicket($ticketId: ID!) {
    deleteTicket(ticketId: $ticketId)
  }
`;

export const GET_RAFFLE_NUMBERS = gql`
  query GetTicketsNumbers($eventId: ID) {
    getTicketsNumbers(eventId: $eventId) {
      number
      buyerName
      buyerEmail
      paid
    }
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const STATUS_META = {
  pending_payment: {
    label: "Pendiente",
    tw: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-400",
  },
  paid: {
    label: "Pagado",
    tw: "bg-green-50 text-green-700 border border-green-200",
    dot: "bg-green-500",
  },
  checked_in: {
    label: "Ingresó",
    tw: "bg-blue-50 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
  },
  partially_used: {
    label: "Parcial",
    tw: "bg-purple-50 text-purple-700 border border-purple-200",
    dot: "bg-purple-500",
  },
  fully_used: {
    label: "Usado",
    tw: "bg-gray-100 text-gray-600 border border-gray-200",
    dot: "bg-gray-400",
  },
  cancelled: {
    label: "Cancelado",
    tw: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
};

export const TYPE_META = {
  assigned: { label: "Asignada", icon: "👤" },
  purchased: { label: "Comprada", icon: "🛒" },
  courtesy: { label: "Cortesía", icon: "🎁" },
  extra: { label: "Extra", icon: "➕" },
};

export function getHolderName(ticket) {
  if (ticket.userId) {
    return `${ticket.userId.name} ${ticket.userId.firstSurName} ${
      ticket.userId.secondSurName || ""
    }`.trim();
  }
  return ticket.buyerName || "—";
}

export function getHolderEmail(ticket) {
  return ticket.userId?.email || ticket.buyerEmail || "—";
}

export const fmt = (n) =>
  new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
  }).format(n);

// ─── Micro-components ────────────────────────────────────────────────────────

export function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending_payment;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${m.tw}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function Spinner() {
  return (
    <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin flex-shrink-0" />
  );
}

export function EmptyState({ icon = "🎟️", title = "Sin resultados", subtitle = "" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
      <span className="text-4xl opacity-40">{icon}</span>
      <span className="font-medium text-gray-500 text-sm">{title}</span>
      {subtitle && <span className="text-xs">{subtitle}</span>}
    </div>
  );
}

export function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export function ScanResultOverlay({ result, onDismiss, onSettlePayment, settlingPayment = false }) {
  if (!result) return null;
  const isOk = result.canEnter;
  const ticket = result.ticket;
  const name = ticket
    ? ticket.userId
      ? `${ticket.userId.name} ${ticket.userId.firstSurName}`.trim()
      : ticket.buyerName
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onDismiss}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onDismiss();
      }}
      role="button"
      tabIndex={0}
    >
      <div
        className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        role="presentation"
      >
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-5 ${
            isOk ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          }`}
        >
          {isOk ? "✓" : "✕"}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {isOk ? "Acceso autorizado" : "Acceso denegado"}
        </h3>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">{result.message}</p>

        {ticket && (
          <div className="bg-gray-50 rounded-xl p-4 text-left mb-5 border border-gray-100 space-y-1">
            {name && <p className="font-semibold text-gray-900 text-sm">{name}</p>}
            <p className="text-xs text-gray-500">
              {TYPE_META[ticket.type]?.label} · {TYPE_META[ticket.type]?.icon} · {ticket.scans}/
              {ticket.ticketQuantity} ingresos
            </p>
            {result.totalDue > 0 && (
              <p className="text-xs text-gray-500">
                Pagado: {fmt(ticket.amountPaid || 0)} de {fmt(result.totalDue)}
              </p>
            )}
            {!ticket.paid && ticket.type !== "courtesy" && (
              <p className="text-xs text-amber-600 font-medium">⚠ Pendiente de pago</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {!isOk && result.canMarkPaid && typeof onSettlePayment === "function" && (
            <button
              onClick={onSettlePayment}
              disabled={settlingPayment}
              className="w-full bg-green-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {settlingPayment
                ? "Registrando pago…"
                : `Marcar pago total (${fmt(result.balanceDue)})`}
            </button>
          )}
          <button
            onClick={onDismiss}
            className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Continuar escaneando
          </button>
        </div>
      </div>
    </div>
  );
}
