// ─── Sabre Booking APIs ─────────────────────────────────────────────────────
// CreatePassengerNameRecord, retrieve booking, and cancel booking.

import { sabreRequest } from "./client";
import type { CreateBookingParams } from "./types";

/**
 * Create a Passenger Name Record (PNR).
 * Orchestrated API that can book air, hotel, and car in a single call.
 * POST /v2.5.0/passenger/records?mode=create
 */
export async function createBooking(params: CreateBookingParams) {
  const passengers = params.passengers.map((p, i) => ({
    NameNumber: `${i + 1}.1`,
    GivenName: p.firstName,
    Surname: p.lastName,
    ...(p.dateOfBirth ? { DateOfBirth: p.dateOfBirth } : {}),
    ...(p.gender ? { Gender: p.gender } : {}),
    PassengerType: "ADT",
  }));

  const body: Record<string, unknown> = {
    CreatePassengerNameRecordRQ: {
      version: "2.5.0",
      TravelItineraryAddInfo: {
        AgencyInfo: {
          Ticketing: { TicketType: "7TAW" },
        },
        CustomerInfo: {
          ContactNumbers: {
            ContactNumber: [
              {
                Phone: params.contactInfo.phone,
                Type: "H",
              },
            ],
          },
          Email: [
            {
              Address: params.contactInfo.email,
              Type: "TO",
            },
          ],
          PersonName: passengers,
        },
      },
      PostProcessing: {
        EndTransaction: {
          Source: { ReceivedFrom: "AXIS BOOKING" },
        },
      },
    },
  };

  // Add air segments
  if (params.flightSegments?.length) {
    const airBook = {
      OriginDestinationInformation: {
        FlightSegment: params.flightSegments.map((seg, i) => ({
          DepartureDateTime: seg.departureDateTime,
          FlightNumber: seg.flightNumber,
          NumberInParty: String(params.passengers.length),
          ResBookDesigCode: seg.bookingClass,
          Status: "NN",
          OriginLocation: { LocationCode: seg.origin },
          DestinationLocation: { LocationCode: seg.destination },
          MarketingAirline: {
            Code: seg.airlineCode,
            FlightNumber: seg.flightNumber,
          },
        })),
      },
    };
    (body.CreatePassengerNameRecordRQ as Record<string, unknown>).AirBook = airBook;
  }

  // Add hotel segments
  if (params.hotelSegments?.length) {
    const hotelBook = {
      BookingInfo: params.hotelSegments.map((seg) => ({
        HotelCode: seg.hotelCode,
        CheckInDate: seg.checkIn,
        CheckOutDate: seg.checkOut,
        NumberOfGuests: String(seg.guests),
        RoomType: seg.roomType,
        RateCode: seg.rateCode,
      })),
    };
    (body.CreatePassengerNameRecordRQ as Record<string, unknown>).HotelBook = hotelBook;
  }

  // Add car segments
  if (params.carSegments?.length) {
    const vehicleBook = {
      VehSegment: params.carSegments.map((seg) => ({
        VehRentalCore: {
          PickUpDateTime: seg.pickUpDateTime,
          ReturnDateTime: seg.returnDateTime,
          PickUpLocation: { LocationCode: seg.pickUpLocation },
          ReturnLocation: { LocationCode: seg.returnLocation },
        },
        VehPref: {
          Code: seg.vehicleType,
          VendorPref: { Code: seg.vendorCode },
        },
      })),
    };
    (body.CreatePassengerNameRecordRQ as Record<string, unknown>).VehicleBook = vehicleBook;
  }

  return sabreRequest("/v2.5.0/passenger/records", {
    method: "POST",
    body,
    params: { mode: "create" },
  });
}

/**
 * Retrieve a booking by PNR locator.
 * POST /v1/trip/orders/getBooking
 */
export async function getBooking(pnrLocator: string) {
  return sabreRequest("/v1/trip/orders/getBooking", {
    method: "POST",
    body: {
      confirmationId: pnrLocator,
    },
  });
}

/**
 * Cancel a booking by PNR locator.
 * POST /v1/trip/orders/cancelBooking
 */
export async function cancelBooking(pnrLocator: string) {
  return sabreRequest("/v1/trip/orders/cancelBooking", {
    method: "POST",
    body: {
      confirmationId: pnrLocator,
    },
  });
}
