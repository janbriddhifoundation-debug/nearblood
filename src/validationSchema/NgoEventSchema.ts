// validationSchema/NgoEventSchema.ts

import * as yup from "yup";

export const ngoEventSchema = yup.object({
  eventName: yup.string().required("Event name is required"),

  purpose: yup.string().nullable(),

  eventDate: yup.date().required("Event date is required"),

  venueName: yup.string().required("Venue is required"),

  latitude: yup.number().required("Latitude is required"),

  longitude: yup.number().required("Longitude is required"),

  partnerBloodBank: yup.string().required("Partner blood bank is required"),

  donorsRequired: yup.number().required("Donors required is mandatory").min(1),

  imageFilekey: yup.string().required("Event image is required"),

  notes: yup.string().nullable(),
});
