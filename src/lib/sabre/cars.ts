// ─── Sabre Car Rental APIs ──────────────────────────────────────────────────
// Vehicle availability search and booking.

import { sabreRequest } from "./client";
import type { CarSearchParams } from "./types";

/**
 * Search for car rental availability.
 * POST /v2/shop/cars
 */
export async function searchCars(params: CarSearchParams) {
  const body = {
    OTA_VehAvailRateRQ: {
      VehAvailRQCore: {
        Status: "Available",
        VehRentalCore: {
          PickUpDateTime: params.pickUpDateTime,
          ReturnDateTime: params.returnDateTime,
          PickUpLocation: {
            LocationCode: params.pickUpLocation,
          },
          ReturnLocation: {
            LocationCode: params.returnLocation || params.pickUpLocation,
          },
        },
        ...(params.vendorCode
          ? {
              VendorPrefs: {
                VendorPref: [{ Code: params.vendorCode }],
              },
            }
          : {}),
        ...(params.vehicleType
          ? {
              VehPrefs: {
                VehPref: [{ Code: params.vehicleType }],
              },
            }
          : {}),
      },
    },
  };

  return sabreRequest("/v2/shop/cars", {
    method: "POST",
    body,
  });
}

/**
 * Book a rental car.
 * POST /v1/book/cars
 */
export async function bookCar(params: {
  pickUpLocation: string;
  returnLocation?: string;
  pickUpDateTime: string;
  returnDateTime: string;
  vehicleType: string;
  vendorCode: string;
  rateCode?: string;
  passenger: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}) {
  const body = {
    OTA_VehResRQ: {
      VehResRQCore: {
        VehRentalCore: {
          PickUpDateTime: params.pickUpDateTime,
          ReturnDateTime: params.returnDateTime,
          PickUpLocation: { LocationCode: params.pickUpLocation },
          ReturnLocation: {
            LocationCode: params.returnLocation || params.pickUpLocation,
          },
        },
        Customer: {
          Primary: {
            PersonName: {
              GivenName: params.passenger.firstName,
              Surname: params.passenger.lastName,
            },
            Email: params.passenger.email,
            Telephone: { PhoneNumber: params.passenger.phone },
          },
        },
        VehPref: {
          Code: params.vehicleType,
          VendorPref: { Code: params.vendorCode },
        },
      },
    },
  };

  return sabreRequest("/v1/book/cars", {
    method: "POST",
    body,
  });
}
