const User = require("../models/User");
const PersonRecord = require("../models/PersonRecord");
const TblBook = require("../models/TblBook");
const Property = require("../models/Property");
const moment = require("moment");
const { Op, or, where } = require("sequelize");
// const { sendResponse } = require("../utils");
const twilio = require("twilio");
const Sib = require("sib-api-v3-sdk");
require("dotenv").config();
const { default: axios } = require("axios");

const uploadToS3 = require("../config/fileUpload.aws");
const HostTravelerReview = require("../models/HostTravelerReview");
const TblNotification = require("../models/TblNotification");
const TravelerHostReview = require("../models/TravelerHostReview");
const PaymentList = require("../models/PaymentList");
const router = require("../routes/adminRoutes");
const PropertyBlock = require("../models/PropertyBlock");

const sendResponse = (res, code, result, msg, additionalData = {}) => {
  res.status(code).json({
    ResponseCode: code,
    Result: result,
    ResponseMsg: msg,
    ...additionalData,
  });
};

// Twilio Configuration
const client = new twilio(
  process.env.TWILIO_ACCOUNT_TOKEN,
  process.env.TWILIO_AUTH_TOKEN
);

// const sendWhatsAppMessage = async (to, message) => {
//   try {
//     console.log(`Sending WhatsApp message to: ${to}`);
//     const response = await client.messages.create({
//       from: process.env.TWILIO_WHATSAPP_NUMBER,
//       // to: `whatsapp:+91${to}`,
//       to: `whatsapp:+91${to.trim()}`,
//       body: message,
//     });
//     console.log(`WhatsApp message sent successfully to ${to}`, response.sid);
//   } catch (error) {
//     console.error("Error sending WhatsApp message:", error);
//     if (error.code === 63003) {
//       console.error("Twilio sandbox not enabled for this number. Ensure the traveler and host have joined Twilio sandbox.");
//     } else if (error.code === 21606) {
//       console.error("The recipient is not enabled for WhatsApp messaging.");
//     }
//   }
// };

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_WHATSAPP_SENDER = process.env.BREVO_WHATSAPP_SENDER;

function formatPhoneNumber(number) {
  if (!number.startsWith("+")) {
    return `+91${number}`;
  }
  return number;
}

async function sendWhatsAppMessage(
  recipient,
  firstName,
  bookingId,
  templateId
) {
  try {
    const formattedNumber = formatPhoneNumber(recipient);
    console.log("Message sending from:", BREVO_WHATSAPP_SENDER);

    const payload = {
      senderNumber: BREVO_WHATSAPP_SENDER,
      contactNumbers: [formattedNumber],
      templateId: parseInt(templateId, 10),
      params: {
        FIRSTNAME: firstName,
        BOOKING_ID: bookingId,
      },
    };

    const response = await axios.post(
      "https://api.brevo.com/v3/whatsapp/sendMessage",
      payload,
      {
        headers: {
          accept: "application/json",
          "api-key": BREVO_API_KEY,
          "content-type": "application/json",
        },
      }
    );

    console.log(`WhatsApp message sent to: ${formattedNumber}`, response.data);
  } catch (error) {
    console.error(
      `Error sending WhatsApp message to: ${recipient}`,
      error.response?.data || error.message
    );
  }
}

// Test calls
// sendWhatsAppMessage(
//   "+918688468369",
//   "John",
//   "ABC123",
//   process.env.BREVO_TEMPLATE_ID
// );
// sendWhatsAppMessage(
//   "+919505171479",
//   "Jane",
//   "XYZ987",
//   process.env.BREVO_TEMPLATE_ID
// );

const sendEmailNotification = async (toEmail, subject, content) => {
  try {
    const client = Sib.ApiClient.instance;
    const apiKey = client.authentications["api-key"];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const transactionalEmailApi = new Sib.TransactionalEmailsApi();
    const sender = {
      email: "servostay@gmail.com",
      name: "Servostay",
    };
    const receivers = [{ email: toEmail }];

    const response = await transactionalEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject,
      htmlContent: content,
    });

    console.log(`Email sent successfully to ${toEmail}`, response);
  } catch (error) {
    console.error(
      "Error sending email:",
      error.response ? error.response.data : error
    );
  }
};

const createBooking = async (req, res) => {
  const uid = req.user.id;
  const {
    prop_id,
    check_in,
    check_out,
    subtotal,
    total,
    tax,
    p_method_id,
    book_for,
    prop_price,
    total_day,
    add_note,
    transaction_id,
    cou_amt = 0,
    extra_guest,
    extra_guest_charges,
    fname,
    lname,
    gender,
    email,
    mobile,
    ccode,
    country,
    adults,
    children,
    infants,
    pets,
    id_proof,
    platform_fee,
  } = req.body;

  const id_proof_img = req.file;

  if (
    !prop_id ||
    !check_in ||
    !check_out ||
    !subtotal ||
    !total ||
    !tax ||
    !p_method_id ||
    !book_for ||
    !prop_price ||
    !transaction_id
  ) {
    return res
      .status(401)
      .json({ success: false, message: "Something Went Wrong!" });
  }

  if (book_for === "other") {
    if (
      !fname ||
      !lname ||
      !gender ||
      // !email ||
      !mobile
      // !ccode ||
      // !country
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required when booking for someone else. Please provide first name, last name, gender, email, mobile, country code, and country.",
      });
    }
  }

  try {
    const user = await User.findByPk(uid);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User Not Found!" });
    }

    const property = await Property.findOne({
      where: { id: prop_id, status: 1 },
    });
    if (!property) {
      return res
        .status(401)
        .json({ success: false, message: "Property Not Found!" });
    }

    if (
      (check_in >= property.block_start && check_in <= property.block_end) ||
      (check_out >= property.block_start && check_out <= property.block_end) ||
      (check_in <= property.block_start && check_out >= property.block_end)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This Property is blocked during the selected dates. Please select different dates.",
      });
    }

    if (
      adults > property.adults ||
      children > property.children ||
      infants > property.infants ||
      pets > property.pets
    ) {
      return res.status(401).json({
        success: false,
        message: `Guests limit exceeded! Adults: ${property.adults}, Children: ${property.children}, Infants: ${property.infants}, Pets: ${property.pets}`,
      });
    }

    const existingBookings = await TblBook.findOne({
      where: {
        prop_id,
        book_status: { [Op.ne]: "Cancelled" },
        [Op.or]: [
          { check_in: { [Op.between]: [check_in, check_out] } },
          { check_out: { [Op.between]: [check_in, check_out] } },
        ],
      },
    });

    if (existingBookings) {
      return res
        .status(401)
        .json({ success: false, message: "That Date Range Already Booked!" });
    }

    // let idProofUrl;
    // try {
    //   // Wrap the single file into an array to work with uploadToS3
    //   const uploadedFiles = await uploadToS3([id_proof_img], "id-proof-images");
    //   idProofUrl = uploadedFiles; // Extract the first URL (only one file uploaded)
    // } catch (error) {
    //   console.error("Error uploading ID proof to S3:", error);
    //   return res.status(500).json({
    //     success: false,
    //     message: "Failed to upload ID proof. Please try again later.",
    //   });
    // }

    let idProofUrl = null;
    if (id_proof_img) {
      try {
        // Wrap the single file into an array to work with uploadToS3
        const uploadedFiles = await uploadToS3(
          [id_proof_img],
          "id-proof-images"
        );
        idProofUrl = uploadedFiles; // Extract the first URL (only one file uploaded)
      } catch (error) {
        console.error("Error uploading ID proof to S3:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to upload ID proof. Please try again later.",
        });
      }
    }

    const bookingData = {
      prop_id,
      uid,
      check_in,
      check_out,
      subtotal,
      total,
      tax,
      p_method_id,
      book_for,
      prop_price,
      total_day,
      book_date: new Date(),
      add_note,
      transaction_id,
      cou_amt,
      prop_title: property.title,
      prop_img: property.image,
      add_user_id: property.add_user_id,
      extra_guest,
      extra_guest_charges,
      adults,
      children,
      infants,
      pets,

      id_proof,
      id_proof_img: idProofUrl || null,

      book_status: "Confirmed",
      platform_fee,
    };

    const booking = await TblBook.create(bookingData);

    if (book_for === "other") {
      await PersonRecord.create({
        fname,
        lname,
        gender,
        email,
        mobile,
        ccode,
        country,
        book_id: booking.id,
      });
    }
    let host = null;
    // if (property.add_user_id) {
    //   const u_id = property.add_user_id;
    //   host = await User.findByPk(u_id);
    // }
    if (property.add_user_id) {
      host = await User.findByPk(property.add_user_id);
    }

    const userEmailContent = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; font-size:1rem">
    <h3>Hello ${user.name},</h3>
    <p><strong>Thanks ${user.name}! Your booking at ${booking.prop_title} is 
  <span style="color: #333; font-weight: bold;">confirmed</span>.
</strong></p>
<p>We are delighted to confirm your stay. Prepare for a comfortable and luxurious experience. Below are your reservation details:</p>
<p>From the moment you arrive, we want you to feel at home. Enjoy world-class amenities, exceptional hospitality, and a seamless stay tailored to your comfort. Whether you’re here for business, leisure, or a special occasion, we are committed to making your experience unforgettable.</p>
<p>If you have any special requests or need assistance, feel free to reach out to us. We look forward to welcoming you soon!</p>

    <h4 style="color: #045D78; font-size:1.5rem">📌 Booking Details</h4>
    <table border="1" cellpadding="8" cellspacing="0" width="100%" style="border-collapse: collapse;">
      <tr><td><strong>Booking ID</strong></td><td>${booking.id}</td></tr>
      <tr><td><strong>Property Name</strong></td><td>${booking.prop_title}</td></tr>
      <tr><td><strong>Check-in Date</strong></td><td>${booking.check_in}</td></tr>
      <tr><td><strong>Check-out Date</strong></td><td>${booking.check_out}</td></tr>
      <tr><td><strong>Total Amount</strong></td><td>₹${booking.total}</td></tr>
      <tr><td><strong>Transaction ID</strong></td><td>${booking.transaction_id}</td></tr>
      <tr><td><strong>Payment Method</strong></td><td>${booking.p_method_id}</td></tr>
      <tr><td><strong>Tax</strong></td><td>${booking.tax}%</td></tr>
      <tr><td><strong>Guests</strong></td><td>${booking.adults} Adults, ${booking.children} Children, ${booking.infants} Infants, ${booking.pets} Pets</td></tr>
      <tr><td><strong>ID Proof</strong></td><td>${booking.id_proof}</td></tr>
    </table>

    <h4 style="color: #045D78; font-size:1.5rem">🏡 Property Details</h4>
    <table border="1" cellpadding="8" cellspacing="0" width="100%" style="border-collapse: collapse;">
      <tr><td><strong>Address</strong></td><td>${property.address}</td></tr>
      <tr><td><strong>Price per Night</strong></td><td>₹${property.price}</td></tr>
      <tr><td><strong>Beds</strong></td><td>${property.beds}</td></tr>
      <tr><td><strong>Bathrooms</strong></td><td>${property.bathroom}</td></tr>
      <tr><td><strong>Size</strong></td><td>${property.sqrft} sq ft</td></tr>
      <tr><td><strong>Rules</strong></td><td>${property.rules.join(", ")}</td></tr>
      <tr><td><strong>Check-in Time</strong></td><td>${property.standard_rules.checkIn}</td></tr>
      <tr><td><strong>Check-out Time</strong></td><td>${property.standard_rules.checkOut}</td></tr>
    </table>

    <h4 style="color: #045D78; font-size:1.5rem">👤 Property Owner Details</h4>
    <table border="1" cellpadding="8" cellspacing="0" width="100%" style="border-collapse: collapse;">
      <tr><td><strong>Host Name</strong></td><td>${host ? host.name : "N/A"}</td></tr>
      <tr><td><strong>Contact</strong></td><td>${host ? host.email : "N/A"}</td></tr>
      <tr><td><strong>Phone</strong></td><td>${host ? host.mobile : "N/A"}</td></tr>
    </table>

    <p>Thank you for choosing <strong>Servostay</strong>. Enjoy your stay!</p>
  </div>
`;

    await sendEmailNotification(
      user.email,
      "Booking Confirmed!",
      userEmailContent
    );

    if (host) {
      const hostEmailContent = `
      <h3>Hello ${host.name},</h3>
      <p>You have received a new booking for your property <strong>${booking.prop_title}</strong>.</p>
  
      <h4>📌 Booking Details:</h4>
      <ul>
        <li><strong>Booking ID:</strong> ${booking.id}</li>
        <li><strong>Check-in Date:</strong> ${booking.check_in}</li>
        <li><strong>Check-out Date:</strong> ${booking.check_out}</li>
        <li><strong>Total Amount Paid:</strong> ₹${booking.total}</li>
      </ul>
  
      <h4>👤 Traveler Details:</h4>
      <ul>
        <li><strong>Name:</strong> ${user.name}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Phone:</strong> ${user.phone}</li>
      </ul>
  
      <p>Please check your dashboard for more details.</p>
    `;

      await sendEmailNotification(
        host.email,
        "New Booking Received!",
        hostEmailContent
      );
    }

    // Sending WhatsApp Notifications
    // const userMessage = `Hello ${user.name}, your booking for ${booking.prop_title} has been confirmed! Booking ID: ${booking.id}`;
    // await sendWhatsAppMessage(user.mobile, userMessage);

    // if (host) {
    //   const hostMessage = `Hello ${host.name}, you have received a new booking for ${booking.prop_title}. Booking ID: ${booking.id}`;
    //   await sendWhatsAppMessage(host.mobile, hostMessage);
    // }

    //   // For Traveler
    await sendWhatsAppMessage(
      user.mobile,
      user.name,
      booking.id,
      process.env.BREVO_TEMPLATE_ID
    );

    // // For Host (if exists)
    // if (host) {
    //   await sendWhatsAppMessage(host.mobile, host.name, booking.id, process.env.BREVO_TEMPLATE_ID_HOST);
    // }

    // const userMessage = `Hello ${user.name}, your booking for ${booking.prop_title} has been confirmed! Booking ID: ${booking.id},`;
    // await sendWhatsAppMessage(user.mobile, userMessage);

    // if (host) {
    //   const hostMessage = `Hello ${host.name}, you have received a new booking for ${booking.prop_title}. Booking ID: ${booking.id}`;
    //   await sendWhatsAppMessage(host.mobile, hostMessage);
    // }

    if (host) {
      await sendWhatsAppMessage(
        host.mobile,
        host.name,
        booking.id,
        process.env.BREVO_TEMPLATE_ID_HOST
      );
    }

    // Send notifications
    try {
      if (host && host.one_subscription) {
        await axios.post(
          "https://onesignal.com/api/v1/notifications",
          {
            app_id: process.env.ONESIGNAL_APP_ID,
            include_player_ids: [host.one_subscription],
            data: { user_id: user.id, type: "booking_confirmed" },
            contents: {
              en: `New booking confirmed for ${booking.prop_title}. Booking ID: ${booking.id}`,
            },
            headings: { en: "New Booking Received!" },
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
            },
          }
        );
      }

      if (user.one_subscription) {
        await axios.post(
          "https://onesignal.com/api/v1/notifications",
          {
            app_id: process.env.ONESIGNAL_APP_ID,
            include_player_ids: [user.one_subscription],
            data: { user_id: user.id, type: "booking_confirmed" },
            contents: {
              en: `Your booking for ${booking.prop_title} has been confirmed! Booking ID: ${booking.id}`,
            },
            headings: { en: "Booking Confirmed!" },
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
            },
          }
        );
      }
    } catch (error) {
      console.log("Error sending notifications:", error);
    }

    await TblNotification.create({
      uid: uid,
      datetime: new Date(),
      title: "Booking Confirmed",
      description: `Your booking for ${booking.prop_title} has been confirmed! Booking ID: ${booking.id}`,
    });
    if (host) {
      await TblNotification.create({
        uid: host.id,
        datetime: new Date(),
        title: "New Booking",
        description: `A new booking has been confirmed for ${booking.prop_title}. Booking ID: ${booking.id}`,
      });
    }

    let propertyObj = property.toJSON();

    // Process rules field:
    let rulesArray;
    if (Array.isArray(propertyObj.rules)) {
      rulesArray = propertyObj.rules;
    } else if (typeof propertyObj.rules === "string") {
      try {
        const parsed = JSON.parse(propertyObj.rules);
        rulesArray = Array.isArray(parsed) ? parsed : [parsed];
      } catch (error) {
        try {
          rulesArray = propertyObj.rules.split(",").map((rule) => rule.trim());
        } catch (e) {
          rulesArray = [];
        }
      }
    } else {
      rulesArray = [];
    }
    // Helper function to recursively flatten an array.
    const flattenArray = (arr) =>
      arr.reduce(
        (acc, val) =>
          Array.isArray(val) ? acc.concat(flattenArray(val)) : acc.concat(val),
        []
      );
    rulesArray = flattenArray(rulesArray);
    propertyObj.rules = rulesArray;

    return res.status(200).json({
      success: true,
      message: "Booking Confirmed Successfully!!!",
      data: {
        book_id: booking.id,
        booking_details: booking,
        property_details: propertyObj,
      },
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
};

const editBooking = async (req, res) => {
  function formatPhoneNumber(number) {
    if (!number.startsWith("+")) {
      return `+91${number}`;
    }
    return number;
  }
  async function sendWhatsAppMessage(
    recipient,
    firstName,
    bookingId,
    templateId
  ) {
    try {
      const formattedNumber = formatPhoneNumber(recipient);
      console.log("Message sending from:");
      const payload = {
        senderNumber: process.env.BREVO_WHATSAPP_SENDER,
        contactNumbers: [formatPhoneNumber],
        templateId: parseInt(templateId, 10),
        params: {
          FIRSTNAME: firstName,
          BOOKING_ID: bookingId,
        },
      };
      const response = await axios.post(
        "https://api.brevo.com/v3/whatsapp/sendMessage",
        payload,
        {
          headers: {
            accept: "application/json",
            "api-key": BREVO_API_KEY,
            "content-type": "application/json",
          },
        }
      );
      console.log(
        `WhatsApp message sent to: ${formattedNumber}`,
        response.data
      );
    } catch (error) {
      console.error(
        `Error sending WhatsApp message to: ${recipient}`,
        error.response?.data || error.message
      );
    }
  }
  const uid = req.user.id;
  const { book_id } = req.params;
  const {
    check_in,
    check_out,
    add_note,
    book_for,
    id_proof,
    extra_guest,
    adults,
    children,
    infants,
    pets,
    fname,
    lname,
    gender,
    mobile,
    email,
    country,
    ccode,
    subtotal,
    total,
    total_day,
    cou_amt,
    wall_amt,
    transaction_id,
    prop_price,
    p_method_id,
    tax,
    extra_guest_charges,
    platform_fee,
  } = req.body;
  const id_proof_img = req.file;
  try {
    const booking = await TblBook.findOne({ where: { id: book_id, uid } });
    if (!booking) {
      return res.status(403).json({
        success: false,
        message: "Your not authorized to edit the booking.",
      });
    }
    const property = await Property.findOne({ where: { id: booking.prop_id } });
    if (
      (check_in >= property.block_start && check_in <= property.block_end) ||
      (check_out >= property.block_start && check_out <= property.block_end) ||
      (check_in <= property.block_start && check_out >= property.block_end)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This Property is blocked during the selected dates. Please select different dates.",
      });
    }
    if (
      adults > property.adults ||
      children > property.children ||
      infants > property.infants ||
      pets > property.pets
    ) {
      return res.status(401).json({
        success: false,
        message: `Guests limit exceeded! Adults: ${property.adults}, Children: ${property.children}, Infants: ${property.infants}, Pets: ${property.pets}`,
      });
    }
    let idProofUrl = booking.id_proof_img;
    if (id_proof_img) {
      try {
        const uploadedFiles = await uploadToS3(
          [id_proof_img],
          "id-proof-images"
        );
        idProofUrl = uploadedFiles;
      } catch (error) {
        console.error("Error uploading ID proof to S3:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to upload ID proof. Please try again later.",
        });
      }
    }

    await booking.update({
      check_in,
      check_out,
      add_note,
      book_for,
      id_proof,
      id_proof_img: idProofUrl,
      extra_guest,
      adults,
      children,
      infants,
      pets,
      subtotal,
      total,
      total_day,
      cou_amt,
      wall_amt,
      transaction_id,
      prop_price,
      p_method_id,
      tax,
      platform_fee,
      extra_guest_charges,
    });
    if (book_for === "other") {
      const personRecord = await PersonRecord.findOne({ where: { book_id } });
      if (personRecord) {
        await personRecord.update({
          fname,
          lname,
          gender,
          mobile,
          email,
          country,
          ccode,
        });
      } else {
        await PersonRecord.create({
          book_id,
          fname,
          lname,
          gender,
          email,
          mobile,
          country,
          ccode,
        });
      }
    }
    const traveler = await User.findByPk(uid);
    const host = await User.findByPk(property.add_user_id);

    await sendWhatsAppMessage(
      traveler.mobile,
      traveler.name,
      booking.id,
      process.env.BREVO_EDIT_TEMPLATE_ID_TRAVELER
    );

    if (host) {
      await sendWhatsAppMessage(
        host.mobile,
        host.name,
        booking.id,
        process.env.BREVO_EDIT_TEMPLATE_ID_HOST
      );
    }

    const travelerEmailContent = `
      <h3>Hello ${traveler.name},</h3>
      <p>Your booking for <strong>${booking.prop_title}</strong> has been updated.</p>
      <p><strong>Booking ID:</strong> ${booking.id}</p>
      <p>Thank you for choosing our platform!</p>
    `;
    await sendEmailNotification(
      traveler.email,
      "Booking Updated!",
      travelerEmailContent
    );

    if (host) {
      const hostEmailContent = `
        <h3>Hello ${host.name},</h3>
        <p>You have received a updated booking for <strong>${booking.prop_title}</strong>.</p>
        <p><strong>Booking ID:</strong> ${booking.id}</p>
        <p>Please check your dashboard for more details.</p>
      `;

      await sendEmailNotification(
        host.email,
        "Booking has been updated!",
        hostEmailContent
      );
    }

    try {
      // Notification for Traveler
      const travelerNotification = {
        app_id: process.env.ONESIGNAL_APP_ID,
        include_player_ids: [traveler.one_subscription],
        data: { user_id: traveler.id, type: "booking_update" },
        contents: {
          en: `Your booking for ${property.title} has been successfully updated!`,
        },
        headings: { en: "Booking Updated!" },
      };

      // Notification for Host
      const hostNotification = {
        app_id: process.env.ONESIGNAL_APP_ID,
        include_player_ids: [host.one_subscription],
        data: { user_id: host.id, type: "booking_update" },
        contents: {
          en: `The booking for ${property.title} has been updated by ${traveler.name}.`,
        },
        headings: { en: "Booking Updated by Guest!" },
      };

      // Send notifications separately
      await axios.post(
        "https://onesignal.com/api/v1/notifications",
        travelerNotification,
        {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
          },
        }
      );

      await axios.post(
        "https://onesignal.com/api/v1/notifications",
        hostNotification,
        {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
          },
        }
      );

      console.log("Notification sent for booking update.");
    } catch (error) {
      console.error("Error sending notification:", error);
    }
    return res.status(201).json({
      success: true,
      message: "Booking Updated successfully!",
      data: booking,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

const confirmBooking = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return sendResponse(res, 401, "false", "User Not Found!");
  }
  const { book_id } = req.body;
  if (!book_id) {
    return sendResponse(res, 401, "false", "book_id is Required!");
  }

  try {
    const booking = await TblBook.findOne({
      where: { id: book_id, uid: uid, book_status: "Confirmed" },
    });
    if (!booking) {
      return sendResponse(
        res,
        404,
        "false",
        "Booking not found or already confirmed!"
      );
    }
    booking.book_status = "Confirmed";
    await booking.save();
    const user = await User.findByPk(uid);

    // Send push notification or email (update the notification logic as required)
    const message = {
      notification: {
        title: "Booking Confirmed",
        body: `${user.name}, Your booking for ${booking.prop_title} has been confirmed! Your Booking ID is ${booking.id}`,
      },
      data: {
        order_id: booking.id,
        type: "booking",
      },
      topic: `booking_${uid}`,
    };

    try {
      const notificationContent = {
        app_id: process.env.ONESIGNAL_APP_ID,
        include_player_ids: [user.one_subscription],
        data: { user_id: user.id, type: "role_change" },
        contents: {
          en: `${user.name}, Your booking for ${booking.prop_title} has been confirmed! Your Booking ID is ${booking.id}`,
        },
        headings: { en: "Booking Confirmed!" },
      };

      const response = await axios.post(
        "https://onesignal.com/api/v1/notifications",
        notificationContent,
        {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
          },
        }
      );

      console.log(response, "notification sent");
    } catch (error) {
      console.log(error);
    }

    // Create a notification record in the database
    await TblNotification.create({
      uid: uid,
      datetime: new Date(),
      title: "Booking Confirmed",
      description: `Your booking for ${booking.prop_title} has been confirmed! Your Booking ID is ${booking.id}`,
    });

    // Return success response
    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Property Booking Confirmed Successfully!",
    });
  } catch (error) {
    console.error("Error confirming booking:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

// Get Booking Details (both self)
const getBookingDetails = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return sendResponse(res, 401, "false", "User Not Found!");
  }
  const { book_id } = req.body;

  const user = await User.findByPk(uid, { attributes: ["name", "languages"] });
  if (!user) {
    return sendResponse(res, 401, "false", "User Not Found!");
  }

  let languages = [];
  try {
    languages = user.languages ? JSON.parse(user.languages) : ["English"];
  } catch (error) {
    console.error("Error parsing languages:", error);
    languages = ["English"];
  }

  // Validation
  if (!book_id) {
    return sendResponse(res, 401, "false", "book_id is Required!");
  }

  try {
    const booking = await TblBook.findOne({
      where: { id: book_id },
      include: [
        {
          model: Property,
          as: "properties",
          attributes: ["add_user_id", "standard_rules"],
        },
      ],
    });

    if (!booking) {
      return sendResponse(
        res,
        404,
        "false",
        "Booking not found or you do not have access to this booking!"
      );
    }

    let checkInTime = "";
    let checkOutTime = "";
    
    if (booking.properties && booking.properties.standard_rules) {
      try {
        const rules = booking.properties.standard_rules;
        
        checkInTime = rules.checkIn || "";
        checkOutTime = rules.checkOut || "";
      } catch (error) {
        console.error("Error parsing standard_rules:", error);
      }
    }
    const formatDate = (date) => {
      return date ? new Date(date).toISOString().split("T")[0] : null;
    };

    const fp = {
      book_id: booking.id,
      prop_id: booking.prop_id,
      prop_title: booking.prop_title,
      uid: booking.uid,
      book_date: formatDate(booking.book_date),
      id_proof: booking.id_proof,
      id_proof_img: booking.id_proof_img,
      check_in: formatDate(booking.check_in),
      check_out: formatDate(booking.check_out),
      payment_title: "",
      subtotal: booking.subtotal,
      total: booking.total,
      tax: booking.tax,
      cou_amt: booking.cou_amt,
      transaction_id: booking.transaction_id,
      p_method_id: booking.p_method_id,
      add_note: booking.add_note,
      book_status: booking.book_status,
      check_intime: checkInTime,
      check_outtime: checkOutTime,
      extra_guest: booking.extra_guest,
      adults: booking.adults,
      children: booking.children,
      infants: booking.infants,
      pets: booking.pets,
      extra_guest_charges: booking.extra_guest_charges,
      book_for: booking.book_for,
      is_rate: booking.is_rate,
      total_rate: booking.total_rate || "",
      rate_text: booking.rate_text || "",
      prop_price: booking.prop_price,
      total_day: booking.total_day,
      cancle_reason: booking.cancle_reason || "",
      languages: languages,
    };

    // Fetch payment method title
    if (booking.p_method_id) {
      const payment = await PaymentList.findOne({
        where: { id: booking.p_method_id },
      });
      if (payment) {
        fp.payment_title = payment.title;
      }
    }

    // If booking is for another person, fetch their details
    if (booking.book_for === "other") {
      const personDetails = await PersonRecord.findOne({
        where: { book_id },
      });

      if (personDetails) {
        fp.fname = personDetails.fname;
        fp.lname = personDetails.lname;
        fp.gender = personDetails.gender;
        fp.email = personDetails.email;
        fp.mobile = personDetails.mobile;
        fp.ccode = personDetails.ccode;
        fp.country = personDetails.country;
      } else {
        fp.fname = "";
        fp.lname = "";
        fp.gender = "";
        fp.email = "";
        fp.mobile = "";
        fp.ccode = "";
        fp.country = "";
      }
    } else {
      fp.fname = "";
      fp.lname = "";
      fp.gender = "";
      fp.email = "";
      fp.mobile = "";
      fp.ccode = "";
      fp.country = "";
    }

    if (booking.properties.add_user_id === uid) {
      const travelerReviews = await HostTravelerReview.findAll({
        where: { traveler_id: booking.uid },
        attributes: ["rating", "review", "createdAt"],
        include: [
          {
            model: User,
            as: "traveler",
            attributes: ["name"],
          },
          {
            model: User,
            as: "host",
            attributes: ["name"],
          },
        ],
      });

      fp.traveler_reviews = travelerReviews.map((review) => ({
        host_name: review.host?.name || "Unknown Host",
        rating: review.rating,
        review: review.review,
        createdAt: review.createdAt,
        traveler_name: review.traveler?.name || "Unknown Traveler",
      }));
    } else {
      fp.traveler_reviews = []; // Do not show reviews to the traveler
    }

    return sendResponse(res, 200, "true", "Book Property Details Found!", {
      bookdetails: fp,
    });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    return sendResponse(res, 500, "false", "Internal Server Error!");
  }
};

const userCheckIn = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return res.status(401).json({ message: "User Not Found!" });
  }
  const { book_id } = req.body;

  if (!book_id) {
    return sendResponse(res, 401, "false", "book_id is Required!");
  }

  try {
    const booking = await TblBook.findOne({
      where: { id: book_id, uid: uid, book_status: "Confirmed" },
      include: [
        {
          model: Property,
          as: "properties",
          attributes: [
            "id",
            "title",
            "facility",
            "ptype",
            "price",
            "address",
            "rate",
            "add_user_id",
          ],
        },
      ],
    });

    if (!booking) {
      return sendResponse(
        res,
        404,
        "false",
        "Booking not found, or you don't have permission to check-in this booking!"
      );
    }

    const property = booking.properties;
    const host = await User.findByPk(property.add_user_id);
    if (!host) {
      return sendResponse(res, 404, "false", "Host not found!");
    }

    await TblBook.update(
      { book_status: "Check_in" },
      { where: { id: book_id, uid } }
    );

    try {
      const notificationContent = {
        app_id: process.env.ONESIGNAL_APP_ID,
        include_player_ids: [req.user.one_subscription, host.one_subscription],
        data: { user_id: uid, type: "check_in" },
        contents: {
          en: `Check-in successful for ${property.title}!`,
        },
        headings: { en: "Check-in Confirmed!" },
      };

      const response = await axios.post(
        "https://onesignal.com/api/v1/notifications",
        notificationContent,
        {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
          },
        }
      );

      console.log("Notification sent for check-in:", response.data);
    } catch (error) {
      console.error("Error sending notification:", error);
    }

    // Save notifications for both traveler and host
    await TblNotification.bulkCreate([
      {
        uid: uid,
        datetime: new Date(),
        title: "Check-in Successful",
        description: `You have successfully checked into ${property.title}. Enjoy your stay!`,
      },
      {
        uid: host.id,
        datetime: new Date(),
        title: "Guest Checked In",
        description: `A guest has checked into your property: ${property.title}.`,
      },
    ]);

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Checked In Successfully!",
      booking: {
        id: booking.id,
        check_in: booking.check_in,
        check_out: booking.check_out,
        book_status: booking.book_status,
        property: booking.properties,
      },
    });
  } catch (error) {
    console.error("Error checking in:", error);
    return sendResponse(res, 500, "false", "Internal Server Error!");
  }
};

// const userCheckOut = async (req, res) => {
//   const uid = req.user.id;
//   if (!uid) {
//     return res.status(401).json({ message: "User Not Found!" });
//   }
//   const { book_id } = req.body;

//   if (!book_id) {
//     return sendResponse(res, 401, "false", "book_id is Required!");
//   }

//   try {
//     const booking = await TblBook.findOne({
//       where: { id: book_id, uid: uid, book_status: "Check_in" },
//     });

//     if (!booking) {
//       return sendResponse(
//         res,
//         404,
//         "false",
//         "Booking not found, or you don't have permission to check-out this booking!"
//       );
//     }

//     await TblBook.update(
//       { book_status: "Completed" },
//       { where: { id: book_id, uid } }
//     );

//     return sendResponse(res, 200, "true", "Checked Out Successfully!");
//   } catch (error) {
//     console.error("Error checking out:", error);
//     return sendResponse(res, 500, "false", "Internal Server Error!");
//   }
// };

// Cancel Booking

const userCheckOut = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return res.status(401).json({ message: "User Not Found!" });
  }
  const { book_id } = req.body;

  if (!book_id) {
    return sendResponse(res, 401, "false", "book_id is required!");
  }

  try {
    const booking = await TblBook.findOne({
      where: { id: book_id, uid: uid, book_status: "Check_in" },
      include: [
        {
          model: Property,
          as: "properties",
          attributes: [
            "id",
            "title",
            "address",
            "ptype",
            "price",
            "rate",
            "add_user_id", // Get the host's user ID
          ],
        },
      ],
    });

    if (!booking) {
      return sendResponse(
        res,
        404,
        "false",
        "Booking not found, or you don't have permission to check out of this booking!"
      );
    }

    const property = booking.properties;
    const host = await User.findByPk(property.add_user_id);
    if (!host) {
      return sendResponse(res, 404, "false", "Host not found!");
    }

    await TblBook.update(
      { book_status: "Completed" },
      { where: { id: book_id, uid } }
    );

    try {
      const notificationContent = {
        app_id: process.env.ONESIGNAL_APP_ID,
        include_player_ids: [req.user.one_subscription, host.one_subscription],
        data: { user_id: uid, type: "check_out" },
        contents: {
          en: `You have successfully checked out from ${property.title}.`,
        },
        headings: { en: "Check-out Completed!" },
      };

      const response = await axios.post(
        "https://onesignal.com/api/v1/notifications",
        notificationContent,
        {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
          },
        }
      );

      console.log("Notification sent for check-out:", response.data);
    } catch (error) {
      console.error("Error sending notification:", error);
    }

    // Save notifications for both traveler and host
    await TblNotification.bulkCreate([
      {
        uid: uid,
        datetime: new Date(),
        title: "Check-out Successful",
        description: `You have successfully checked out from ${property.title}. We hope you had a great stay!`,
      },
      {
        uid: host.id,
        datetime: new Date(),
        title: "Guest Checked Out",
        description: `A guest has checked out from your property: ${property.title}.`,
      },
    ]);

    return sendResponse(res, 200, "true", "Checked Out Successfully!");
  } catch (error) {
    console.error("Error checking out:", error);
    return sendResponse(res, 500, "false", "Internal Server Error!");
  }
};

// const cancelBooking = async (req, res) => {
//   const uid = req.user.id;
//   if (!uid) {
//     return res.status(401).json({ message: "User Not Found!" });
//   }
//   const { book_id, cancle_reason } = req.body;

//   if (!book_id || !uid) {
//     return sendResponse(res, 401, "false", "book_id and uid is required!");
//   }

//   const user = await User.findByPk(uid);
//   if (!user) {
//     return sendResponse(res, 401, "false", "User Not Found!");
//   }

//   try {
//     const booking = await TblBook.findOne({
//       where: {
//         id: book_id,
//         uid: uid,
//         book_status: { [Op.in]: ["Confirmed", "Booked"] },
//       },
//     });

//     if (!booking) {
//       return sendResponse(
//         res,
//         404,
//         "false",
//         "Booking not found, or you don't have permission to cancel this booking!"
//       );
//     }
//     const property = await Property.findOne({ where: { id: booking.prop_id } });
//     if (!property) {
//       return sendResponse(res, 404, "false", "Property not found!");
//     }

//     const host = await User.findByPk(property.add_user_id);
//     if (!host) {
//       return sendResponse(res, 404, "false", "Host not found!");
//     }

//     await TblBook.update(
//       { book_status: "Cancelled", cancle_reason },
//       { where: { id: book_id, uid } }
//     );

//     if (booking.transaction_id && booking.amount_paid > 0) {
//       try {
//         const refundAmount = Math.round(booking.amount_paid * 100); // Ensure correct unit
//         const response = await axios.post(
//           `https://api.razorpay.com/v1/payments/${booking.transaction_id}/refund`,
//           {
//             amount: refundAmount,
//             notes: { refund_reason: cancle_reason || "User requested cancellation" },
//           },
//           {
//             auth: {
//               username: process.env.RAZORPAY_KEY_ID,
//               password: process.env.RAZORPAY_SECRET_KEY,
//             },
//           }
//         );

//         await booking.update({ refund_status: "Processed" });
//       } catch (refundError) {
//         console.error("Refund Error:", refundError.response?.data || refundError.message);
//         await booking.update({ refund_status: "Failed" });
//       }
//     }

//     const traveler = await User.findByPk(uid);

//     const travelerEmailContent = `
//       <h3>Hello ${traveler.name},</h3>
//       <p>Your booking for <strong>${booking.prop_title}</strong> has been Cancelled as per your request.</p>
//       <p><strong>Booking ID:</strong> ${booking.id}</p>
//     `
//     await sendEmailNotification(traveler.email, "Booking has been Cancelled!", travelerEmailContent)

//     if (host) {
//       const hostEmailContent = `
//         <h3>Hello ${host.name},</h3>
//         <p>Traveler has been cancelled his booking for <strong>${booking.prop_title}</strong>.</p>
//         <p><strong>Booking ID:</strong> ${booking.id}</p>
//         <p>Please check your dashboard for more details.</p>
//       `;

//       await sendEmailNotification(host.email, "Booking has been cancelled!", hostEmailContent);
//     }

//     try {
//       const notificationContent = {
//         app_id: process.env.ONESIGNAL_APP_ID,
//         include_player_ids: [user.one_subscription, host.one_subscription],
//         data: { user_id: user.id, type: "booking Cancelled" },
//         contents: {
//           en: `${user.name}, Your booking for ${booking.prop_title} has been cancelled!`,
//         },
//         headings: { en: "Booking Cancelled!" },
//       };

//       const response = await axios.post(
//         "https://onesignal.com/api/v1/notifications",
//         notificationContent,
//         {
//           headers: {
//             "Content-Type": "application/json; charset=utf-8",
//             Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
//           },
//         }
//       );

//       console.log(response, "notification sent");
//     } catch (error) {
//       console.log(error);
//     }

//     // Create notifications for both traveler and host
//     await TblNotification.bulkCreate([
//       {
//         uid: uid,
//         datetime: new Date(),
//         title: "Booking Cancelled",
//         description: `Your booking for ${property.title} has been cancelled!`,
//       },
//       {
//         uid: host.id,
//         datetime: new Date(),
//         title: "Booking Cancelled",
//         description: `A booking for your property ${property.title} has been cancelled!`,
//       },
//     ]);

//     return sendResponse(res, 200, "true", "Booking Cancelled Successfully!");
//   } catch (error) {
//     console.error("Error canceling booking:", error);
//     return sendResponse(res, 500, "false", "Internal Server Error!");
//   }
// };

const cancelBooking = async (req, res) => { 
  function formatPhoneNumber(number) {
    if (!number.startsWith("+")) {
      return `+91${number}`;
    }
    return number;
  }
  async function sendWhatsAppMessage(
    recipient,
    firstName,
    bookingId,
    templateId
  ) {
    try {
      const formattedNumber = formatPhoneNumber(recipient);
      console.log("Message sending from:", BREVO_WHATSAPP_SENDER);

      const payload = {
        senderNumber: BREVO_WHATSAPP_SENDER,
        contactNumbers: [formattedNumber],
        templateId: parseInt(templateId, 10),
        params: {
          FIRSTNAME: firstName,
          BOOKING_ID: bookingId,
        },
      };

      const response = await axios.post(
        "https://api.brevo.com/v3/whatsapp/sendMessage",
        payload,
        {
          headers: {
            accept: "application/json",
            "api-key": BREVO_API_KEY,
            "content-type": "application/json",
          },
        }
      );

      console.log(
        `WhatsApp message sent to: ${formattedNumber}`,
        response.data
      );
    } catch (error) {
      console.error(
        `Error sending WhatsApp message to: ${recipient}`,
        error.response?.data || error.message
      );
    }
  }
  const uid = req.user.id;
  if (!uid) {
    return res.status(401).json({ message: "User Not Found!" });
  }
  const { book_id, cancle_reason } = req.body; // Fixed `cancle_reason`

  if (!book_id || !uid) {
    return sendResponse(res, 401, "false", "book_id and uid are required!");
  }

  const user = await User.findByPk(uid);
  if (!user) {
    return sendResponse(res, 401, "false", "User Not Found!");
  }

  try {
    const booking = await TblBook.findOne({
      where: {
        id: book_id,
        uid: uid,
        book_status: { [Op.in]: ["Confirmed", "Booked"] },
      },
    });

    if (!booking) {
      return sendResponse(
        res,
        404,
        "false",
        "Booking not found, or you don't have permission to cancel this booking!"
      );
    }

    const property = await Property.findOne({ where: { id: booking.prop_id } });
    if (!property) {
      return sendResponse(res, 404, "false", "Property not found!");
    }

    const host = await User.findByPk(property.add_user_id);
    if (!host) {
      return sendResponse(res, 404, "false", "Host not found!");
    }

    // Update booking status
    await TblBook.update(
      { book_status: "Cancelled", cancle_reason },
      { where: { id: book_id, uid } }
    );

    await sendWhatsAppMessage(
      user.mobile,
      user.email,
      booking.id,
      process.env.BREVO_TRAVELER_CANCEL_TEMPLATE_ID_TRAVELER
    );

    if (host) {
      await sendWhatsAppMessage(
        host.mobile,
        host.email,
        booking.id,
        process.env.BREVO_TRAVELER_CANCEL_TEMPLATE_ID_HOST
      );
    }

    let refundMessage = "";

    // Refund Logic
    if (booking.transaction_id && booking.platform_fee > 0) {
      console.log("Transaction ID:", booking.transaction_id);
      console.log("Platform fee Amount:", booking.platform_fee);
      try {
        const refundAmount = Math.round(booking.platform_fee * 100);
        console.log("Refund Amount in Paise:", refundAmount);
        console.log("Initiating refund request to Razorpay...");
        console.log({
          transactionId: booking.transaction_id,
          refundAmount: Math.round(booking.platform_fee * 100),
        });
        await axios.post(
          `https://api.razorpay.com/v1/payments/${booking.transaction_id}/refund`,
          {
            amount: refundAmount,
            notes: {
              refund_reason: cancle_reason || "User requested cancellation",
            },
          },
          {
            auth: {
              username: process.env.RAZORPAY_KEY_ID,
              password: process.env.RAZORPAY_SECRET_KEY,
            },
          }
        );

        console.log("Razorpay Key:", process.env.RAZORPAY_KEY_ID);
        console.log(
          "Razorpay Secret:",
          process.env.RAZORPAY_SECRET_KEY ? "Exists" : "Missing"
        );

        await booking.update({ refund_status: "Processed" });

        const updatedBooking = await TblBook.findByPk(book_id);
        console.log("Updated Refund Status:", updatedBooking.refund_status);

        refundMessage =
          "Refund initiated! Amount credited in 5-7 business days.";
      } catch (refundError) {
        console.error(
          "Refund Error:",
          refundError.response?.data || refundError.message
        );
        await booking.update({ refund_status: "Failed" });
        refundMessage = " Refund initiation failed. Please contact support.";
      }
    }

    // Send Emails to Traveler and Host
    const traveler = await User.findByPk(uid);
    const travelerEmailContent = `
      <h3>Hello ${traveler.name},</h3>
      <p>Your booking for <strong>${property.title}</strong> has been cancelled as per your request.</p>
      <p><strong>Booking ID:</strong> ${booking.id}</p>
      <p>${refundMessage}</p>
    `;
    await sendEmailNotification(
      traveler.email,
      "Booking has been Cancelled!",
      travelerEmailContent
    );

    if (host) {
      const hostEmailContent = `
        <h3>Hello ${host.name},</h3>
        <p>The traveler has cancelled their booking for <strong>${property.title}</strong>.</p>
        <p><strong>Booking ID:</strong> ${booking.id}</p>
        <p>Please check your dashboard for more details.</p>
      `;
      await sendEmailNotification(
        host.email,
        "Booking has been cancelled!",
        hostEmailContent
      );
    }

    // Push Notification via OneSignal
    if (user.one_subscription || host.one_subscription) {
      try {
        const notificationContent = {
          app_id: process.env.ONESIGNAL_APP_ID,
          include_player_ids: [
            user.one_subscription,
            host.one_subscription,
          ].filter(Boolean),
          data: { user_id: user.id, type: "booking Cancelled" },
          contents: {
            en: `${user.name}, Your booking for ${property.title} has been cancelled!${refundMessage}`,
          },
          headings: { en: "Booking Cancelled!" },
        };

        await axios.post(
          "https://onesignal.com/api/v1/notifications",
          notificationContent,
          {
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
            },
          }
        );
      } catch (error) {
        console.log("Notification Error:", error.message);
      }
    }

    // Store Cancellation Notifications
    await TblNotification.bulkCreate([
      {
        uid: uid,
        datetime: new Date(),
        title: "Booking Cancelled",
        description: `Your booking for ${property.title} has been cancelled!${refundMessage}`,
      },
      {
        uid: host.id,
        datetime: new Date(),
        title: "Booking Cancelled",
        description: `A booking for your property ${property.title} has been cancelled!`,
      },
    ]);

    return sendResponse(
      res,
      200,
      "true",
      `Booking Cancelled Successfully!${refundMessage}`
    );
  } catch (error) {
    console.error("Error canceling booking:", error);
    return sendResponse(res, 500, "false", "Internal Server Error!");
  }
};

// const cancelTravelerBookingByHost = async (req, res) => {
//   const hostId = req.user.id;
//   if (!hostId) {
//     return res.status(401).json({ message: "User Not Found!" });
//   }

//   const { book_id, cancle_reason } = req.body;

//   if (!book_id || !hostId) {
//     return sendResponse(res, 401, "false", "book_id and hostId are required!");
//   }

//   const host = await User.findByPk(hostId);
//   if (!host || host.role !== "host") {
//     return sendResponse(
//       res,
//       403,
//       "false",
//       "Unauthorized! Only hosts can cancel bookings."
//     );
//   }

//   try {
//     const booking = await TblBook.findOne({
//       where: {
//         id: book_id,
//         add_user_id: hostId,
//         book_status: { [Op.in]: ["Confirmed", "Booked"] },
//       },
//       include: {
//         model: Property,
//         as: "properties",
//         where: { add_user_id: hostId },
//       },
//     });

//     if (!booking) {
//       return sendResponse(
//         res,
//         404,
//         "false",
//         "Booking not found, or you don't have permission to cancel this booking!"
//       );
//     }

//     await TblBook.update(
//       { book_status: "Cancelled", cancle_reason },
//       { where: { id: book_id, add_user_id: hostId } }
//     );

//     let refundMessage = "";

//     if (booking.transaction_id && booking.platform_fee > 0) {
//       console.log("Transaction ID:", booking.transaction_id);
//       console.log("Platform fee Amount:", booking.platform_fee);
//       try {

//         const refundAmount = Math.round(booking.platform_fee * 100);
//         console.log("Refund Amount in Paise:", refundAmount);
//         console.log("Initiating refund request to Razorpay...");
//         console.log({
//           transactionId: booking.transaction_id,
//           refundAmount: Math.round(booking.platform_fee * 100),
//         });
//         await axios.post(
//           `https://api.razorpay.com/v1/payments/${booking.transaction_id}/refund`,
//           {
//             amount: refundAmount,
//             notes: { refund_reason: cancle_reason || "User requested cancellation" },
//           },
//           {
//             auth: {
//               username: process.env.RAZORPAY_KEY_ID,
//               password: process.env.RAZORPAY_SECRET_KEY,
//             },
//           }
//         );
//         console.log("Razorpay Key:", process.env.RAZORPAY_KEY_ID);
//         console.log("Razorpay Secret:", process.env.RAZORPAY_SECRET_KEY ? "Exists" : "Missing");

//         await booking.update({ refund_status: "Processed" });

//         const updatedBooking = await TblBook.findByPk(book_id);
//         console.log("Updated Refund Status:", updatedBooking.refund_status);

//         refundMessage = "Refund initiated! Amount credited in 5-7 business days.";
//       } catch (refundError) {
//         console.error("Refund Error:", refundError.response?.data || refundError.message);
//         await booking.update({ refund_status: "Failed" });
//         refundMessage = " Refund initiation failed. Please contact support.";
//       }
//     }

//     // Notify the traveler
//     const traveler = await User.findByPk(booking.uid);
//     const hostUser = await User.findByPk(hostId);

//     const travelerEmailContent = `
//       <h3>Hello ${traveler.name},</h3>
//       <p>Your booking for <strong>${booking.prop_title}</strong> has been Cancelled by Owner.</p>
//       <p><strong>Booking ID:</strong> ${booking.id}</p>
//     `
//     await sendEmailNotification(traveler.email, "Booking Updated!", travelerEmailContent)

//     if (hostUser) {
//       const hostEmailContent = `
//         <h3>Hello ${host.name},</h3>
//         <p>You have Cancelled Booking for <strong>${booking.prop_title}</strong>.</p>
//         <p><strong>Booking ID:</strong> ${booking.id}</p>
//         <p>Please check your dashboard for more details.</p>
//       `;

//       await sendEmailNotification(host.email, "Booking has Cancelled!", hostEmailContent);
//     }

//     if (traveler && traveler.one_subscription) {
//       try {
//         const notificationContent = {
//           app_id: process.env.ONESIGNAL_APP_ID,
//           include_player_ids: [traveler.one_subscription],
//           data: { user_id: traveler.id, type: "booking Cancelled" },
//           contents: {
//             en: `Dear ${traveler.name}, your booking for ${booking.prop_title} has been cancelled by the host!`,
//           },
//           headings: { en: "Booking Cancelled By Host" },
//         };

//         const response = await axios.post(
//           "https://onesignal.com/api/v1/notifications",
//           notificationContent,
//           {
//             headers: {
//               "Content-Type": "application/json; charset=utf-8",
//               Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
//             },
//           }
//         );
//         console.log(response.data, "notification sent");
//       } catch (error) {
//         console.log(error);
//       }
//     }

//     if (hostUser && hostUser.one_subscription) {
//       try {
//         await axios.post(
//           "https://onesignal.com/api/v1/notifications",
//           {
//             app_id: process.env.ONESIGNAL_APP_ID,
//             include_player_ids: [hostUser.one_subscription],
//             data: { user_id: hostUser.id, type: "booking_cancelled" },
//             contents: {
//               en: `You have successfully cancelled the booking for "${booking.prop_title}".`,
//             },
//             headings: { en: "Booking Cancellation Confirmed" },
//           },
//           {
//             headers: {
//               "Content-Type": "application/json; charset=utf-8",
//               Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
//             },
//           }
//         );
//       } catch (error) {
//         console.log("Host notification error:", error);
//       }
//     }

//     // Create a notification record in the database
//     await TblNotification.create({
//       uid: booking.uid,
//       datetime: new Date(),
//       title: `Booking Cancelled Due to ${cancle_reason}`,
//       description: `Your booking for ${booking.prop_title} has been cancelled by the host. Booking ID: ${booking.id}`,
//     });

//     return sendResponse(
//       res,
//       200,
//       "true",
//       `Booking Cancelled Successfully by Host! ${refundMessage}`
//     );
//   } catch (error) {
//     console.error("Error canceling booking by host:", error);
//     return sendResponse(res, 500, "false", "Internal Server Error!");
//   }
// };

const cancelTravelerBookingByHost = async (req, res) => {
  function formatPhoneNumber(number) {
    if (!number.startsWith("+")) {
      return `+91${number}`;
    }
    return number;
  }
  async function sendWhatsAppMessage(
    recipient,
    firstName,
    bookingId,
    templateId
  ) {
    try {
      const formattedNumber = formatPhoneNumber(recipient);
      console.log("Message sending from:", BREVO_WHATSAPP_SENDER);

      const payload = {
        senderNumber: BREVO_WHATSAPP_SENDER,
        contactNumbers: [formattedNumber],
        templateId: parseInt(templateId, 10),
        params: {
          FIRSTNAME: firstName,
          BOOKING_ID: bookingId,
        },
      };

      const response = await axios.post(
        "https://api.brevo.com/v3/whatsapp/sendMessage",
        payload,
        {
          headers: {
            accept: "application/json",
            "api-key": BREVO_API_KEY,
            "content-type": "application/json",
          },
        }
      );

      console.log(
        `WhatsApp message sent to: ${formattedNumber}`,
        response.data
      );
    } catch (error) {
      console.error(
        `Error sending WhatsApp message to: ${recipient}`,
        error.response?.data || error.message
      );
    }
  }
  const hostId = req.user.id;
  if (!hostId) {
    return res.status(401).json({ message: "User Not Found!" });
  }

  const { book_id, cancle_reason } = req.body;

  if (!book_id || !hostId) {
    return sendResponse(res, 401, "false", "book_id and hostId are required!");
  }

  const host = await User.findByPk(hostId);
  if (!host || host.role !== "host") {
    return sendResponse(
      res,
      403,
      "false",
      "Unauthorized! Only hosts can cancel bookings."
    );
  }

  try {
    const booking = await TblBook.findOne({
      where: {
        id: book_id,
        add_user_id: hostId,
        book_status: { [Op.in]: ["Confirmed", "Booked"] },
      },
      include: {
        model: Property,
        as: "properties",
        where: { add_user_id: hostId },
      },
    });

    if (!booking) {
      return sendResponse(
        res,
        404,
        "false",
        "Booking not found, or you don't have permission to cancel this booking!"
      );
    }

    const property = await Property.findOne({ where: { id: booking.prop_id } });
    if (!property) {
      return sendResponse(res, 404, "false", "Property not found!");
    }

    const traveler = await User.findByPk(booking.uid);
    if (!traveler) {
      return sendResponse(res, 404, "false", "Traveler not found!");
    }

    // Update booking status
    await TblBook.update(
      { book_status: "Cancelled", cancle_reason },
      { where: { id: book_id, add_user_id: hostId } }
    );

    let refundMessage = "";

    await sendWhatsAppMessage(
      traveler.mobile,
      traveler.email,
      booking.id,
      process.env.BREVO_HOST_CANCEL_TEMPLATE_ID_TRAVELER
    );
    if (host) {
      await sendWhatsAppMessage(
        host.mobile,
        host.name,
        booking.id,
        process.env.BREVO_HOST_CANCEL_TEMPLATE_ID_HOST
      );
    }

    // Refund Logic
    // if (booking.transaction_id && booking.platform_fee > 0) {
    //   console.log("Transaction ID:", booking.transaction_id);
    //   console.log("Platform fee Amount:", booking.platform_fee);
    //   try {
    //     const refundAmount = Math.round(booking.platform_fee * 100);
    //     console.log("Refund Amount in Paise:", refundAmount);
    //     console.log("Initiating refund request to Razorpay...");
    //     console.log({
    //       transactionId: booking.transaction_id,
    //       refundAmount,
    //     });

    //     await axios.post(
    //       `https://api.razorpay.com/v1/payments/${booking.transaction_id}/refund`,
    //       {
    //         amount: refundAmount,
    //         notes: { refund_reason: cancle_reason || "Host cancelled the booking" },
    //       },
    //       {
    //         auth: {
    //           username: process.env.RAZORPAY_KEY_ID,
    //           password: process.env.RAZORPAY_SECRET_KEY,
    //         },
    //       }
    //     );

    //     console.log("Razorpay Key:", process.env.RAZORPAY_KEY_ID);
    //     console.log("Razorpay Secret:", process.env.RAZORPAY_SECRET_KEY ? "Exists" : "Missing");

    //     await booking.update({ refund_status: "Processed" });

    //     const updatedBooking = await TblBook.findByPk(book_id);
    //     console.log("Updated Refund Status:", updatedBooking.refund_status);

    //     refundMessage = "Refund initiated! Amount credited in 5-7 business days.";
    //   } catch (refundError) {
    //     console.error("Refund Error:", refundError.response?.data || refundError.message);
    //     await booking.update({ refund_status: "Failed" });
    //     refundMessage = " Refund initiation failed. Please contact support.";
    //   }
    // }

    if (booking.transaction_id) {
      console.log("Transaction ID:", booking.transaction_id);

      try {
        // Fetch payment details from Razorpay
        const paymentDetails = await axios.get(
          `https://api.razorpay.com/v1/payments/${booking.transaction_id}`,
          {
            auth: {
              username: process.env.RAZORPAY_KEY_ID,
              password: process.env.RAZORPAY_SECRET_KEY,
            },
          }
        );

        const paymentAmount = paymentDetails.data.amount; // Original amount in paise
        const refundedAmount = paymentDetails.data.amount_refunded || 0; // Already refunded in paise

        console.log("Original Payment Amount:", paymentAmount);
        console.log("Already Refunded:", refundedAmount);

        const refundAmount = Math.min(
          paymentAmount - refundedAmount,
          Math.round(booking.platform_fee * 100)
        );

        if (refundAmount <= 0) {
          refundMessage =
            "Refund not possible as the full amount has already been refunded.";
        } else {
          console.log("Refund Amount in Paise:", refundAmount);

          // Process refund request
          await axios.post(
            `https://api.razorpay.com/v1/payments/${booking.transaction_id}/refund`,
            {
              amount: refundAmount,
              notes: {
                refund_reason: cancle_reason || "Host cancelled the booking",
              },
            },
            {
              auth: {
                username: process.env.RAZORPAY_KEY_ID,
                password: process.env.RAZORPAY_SECRET_KEY,
              },
            }
          );

          await booking.update({ refund_status: "Processed" });
          refundMessage =
            "Refund initiated! Amount credited in 5-7 business days.";
        }
      } catch (refundError) {
        console.error(
          "Refund Error:",
          refundError.response?.data || refundError.message
        );
        await booking.update({ refund_status: "Failed" });
        refundMessage = "Refund initiation failed. Please contact support.";
      }
    }

    // Send Emails to Traveler and Host
    const travelerEmailContent = `
      <h3>Hello ${traveler.name},</h3>
      <p>Your booking for <strong>${property.title}</strong> has been cancelled by the host.</p>
      <p><strong>Booking ID:</strong> ${booking.id}</p>
      <p>${refundMessage}</p>
    `;
    await sendEmailNotification(
      traveler.email,
      "Booking Cancelled by Host!",
      travelerEmailContent
    );

    const hostEmailContent = `
      <h3>Hello ${host.name},</h3>
      <p>You have cancelled the booking for <strong>${property.title}</strong>.</p>
      <p><strong>Booking ID:</strong> ${booking.id}</p>
      <p>${refundMessage}</p>
      <p>Please check your dashboard for more details.</p>
    `;
    await sendEmailNotification(
      host.email,
      "Booking Cancelled Successfully!",
      hostEmailContent
    );

    // Push Notification via OneSignal
    if (traveler.one_subscription || host.one_subscription) {
      try {
        const notificationContent = {
          app_id: process.env.ONESIGNAL_APP_ID,
          include_player_ids: [
            traveler.one_subscription,
            host.one_subscription,
          ].filter(Boolean),
          data: { user_id: traveler.id, type: "booking Cancelled by Host" },
          contents: {
            en: `${traveler.name}, Your booking for ${property.title} has been cancelled by the host! ${refundMessage}`,
          },
          headings: { en: "Booking Cancelled!" },
        };

        await axios.post(
          "https://onesignal.com/api/v1/notifications",
          notificationContent,
          {
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
            },
          }
        );
      } catch (error) {
        console.log("Notification Error:", error.message);
      }
    }

    // Store Cancellation Notifications
    await TblNotification.bulkCreate([
      {
        uid: traveler.id,
        datetime: new Date(),
        title: "Booking Cancelled by Host",
        description: `Your booking for ${property.title} has been cancelled by the host. ${refundMessage}`,
      },
      {
        uid: host.id,
        datetime: new Date(),
        title: "Booking Cancelled",
        description: `You have cancelled a booking for your property ${property.title}.`,
      },
    ]);

    return sendResponse(
      res,
      200,
      "true",
      `Booking Cancelled Successfully! ${refundMessage}`
    );
  } catch (error) {
    console.error("Error canceling booking:", error);
    return sendResponse(res, 500, "false", "Internal Server Error!");
  }
};

// Get Traveller Bookings Status
// const getTravelerBookingsByStatus = async (req, res) => {
//   const uid = req.user?.id; // Ensure user is authenticated
//   if (!uid) {
//     return res.status(401).json({ message: "User Not Found!" });
//   }

//   const { status } = req.body;

//   // Validate the `status` parameter
//   if (!status || !["active", "completed", "cancelled"].includes(status)) {
//     return res.status(400).json({
//       ResponseCode: "401",
//       Result: "false",
//       ResponseMsg: "Invalid or missing status parameter!",
//     });
//   }

//   try {
//     // Build query filter based on status
//     let queryFilter = { uid: uid };

//     if (status === "active") {
//       queryFilter.book_status = { [Op.in]: ["Booked", "Confirmed"] };
//     } else if (status === "completed") {
//       queryFilter.book_status = { [Op.eq]: "Completed" };
//     } else if (status === "cancelled") {
//       queryFilter.book_status = { [Op.eq]: "Cancelled" };
//     }

//     // Fetch bookings
//     const bookings = await TblBook.findAll({
//       where: queryFilter,
//       order: [["id", "DESC"]],
//     });

//     if (bookings.length === 0) {
//       return res.status(404).json({
//         ResponseCode: "404",
//         Result: "false",
//         ResponseMsg: "No bookings found for the specified status.",
//       });
//     }

//     const reviews = await TblBook.findAll({
//       where: { is_rate: 1 },
//       attributes: ["is_rate", "total_rate", "rate_text"],
//     });
//     const review = reviews.length > 0 ? reviews : 0;

//     // Fetch property details for each booking
//     const bookingDetails = await Promise.all(
//       bookings.map(async (booking) => {
//         const property = await Property.findOne({
//           where: { id: booking.prop_id },
//           attributes: ["id", "title", "image"],
//         });

//         if (!property) return null; // Skip if the property does not exist

//         return {
//           book_id: booking.id,
//           prop_id: booking.prop_id,
//           prop_title: property.title,
//           prop_img: property.image,
//           book_status: booking.book_status,
//           prop_price: booking.prop_price,
//           p_method_id: booking.p_method_id,
//           total_day: booking.total_day,
//           extra_guest: booking.extra_guest,
//           extra_guest_charges: booking.extra_guest_charges,
//           adults:booking.adults,
//           children:booking.children,
//           infants:booking.infants,
//           pets:booking.pets,
//           check_in:booking.check_in,
//           check_out:booking.check_out,
//         };
//       })
//     );

//     // Filter out null values (e.g., if property is not found)
//     const filteredBookingDetails = bookingDetails.filter((detail) => detail);

//     return res.status(200).json({
//       ResponseCode: "200",
//       Result: "true",
//       ResponseMsg: "Bookings fetched successfully!",
//       statuswise: filteredBookingDetails,
//       review,
//     });
//   } catch (error) {
//     console.error("Error fetching bookings by status:", error);
//     return res.status(500).json({
//       ResponseCode: "500",
//       Result: "false",
//       ResponseMsg: "Internal Server Error!",
//     });
//   }
// };

const getTravelerBookingsByStatus = async (req, res) => {
  const uid = req.user?.id; // Ensure user is authenticated
  if (!uid) {
    return res.status(401).json({ message: "User Not Found!" });
  }

  const { status } = req.body;

  // Validate the `status` parameter
  if (!status || !["active", "completed", "cancelled"].includes(status)) {
    return res.status(400).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Invalid or missing status parameter!",
    });
  }

  try {
    // Build query filter based on status
    let queryFilter = { uid };

    if (status === "active") {
      queryFilter.book_status = { [Op.in]: ["Booked", "Confirmed","Check_in"] };
    } else if (status === "completed") {
      queryFilter.book_status = "Completed";
    } else if (status === "cancelled") {
      queryFilter.book_status = "Cancelled";
    }

    // Fetch complete booking details
    const bookings = await TblBook.findAll({
      where: queryFilter,
      order: [["id", "DESC"]],
    });

    if (!bookings.length) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "No bookings found for the specified status.",
      });
    }

    // Extract booking IDs
    const bookingIds = bookings.map((b) => b.id);

    // Fetch property reviews (if traveler has posted a review)
    const propertyReviews = await TblBook.findAll({
      where: { id: bookingIds, is_rate: 1 },
      attributes: ["id", "is_rate", "total_rate", "rate_text"],
    });

    // Create a review mapping (to efficiently check for property reviews)
    const propertyReviewsMap = propertyReviews.reduce((acc, review) => {
      acc[review.id] = review;
      return acc;
    }, {});
    const propertyIds = bookings.map((b) => b.prop_id);

    const hostIds = bookings.map((b) => b.add_user_id);

    // Fetch traveler reviews for the hosts (if any exist)
    const travelerReviews = await TravelerHostReview.findAll({
      where: {
        traveler_id: uid,
        host_id: { [Op.in]: hostIds },
        property_id: { [Op.in]: propertyIds },
      },
      attributes: ["traveler_id", "host_id", "property_id", "review", "rating"],
    });

    const travelerReviewsMap = travelerReviews.reduce((acc, review) => {
      if (!acc[review.property_id]) {
        acc[review.property_id] = [];
      }
      acc[review.property_id].push(review);
      return acc;
    }, {});

    // Fetch person details where `book_for` exists
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const personDetails = booking.book_for
          ? await PersonRecord.findOne({
              where: { book_id: booking.id },
              attributes: [
                "fname",
                "lname",
                "gender",
                "email",
                "mobile",
                "ccode",
                "country",
              ],
            })
          : null;

        return {
          ...booking.toJSON(),
          personDetails, // Include traveler details if they exist
          propertyReview: propertyReviewsMap[booking.id] || [], // Fetch review if exists, else empty array
          travelerReview: travelerReviewsMap[booking.prop_id] || [], // Fetch traveler review if exists, else empty array
        };
      })
    );

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Bookings fetched successfully!",
      bookings: bookingsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching bookings by status:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

// After Becoming Host
const getMyUserBookings = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return res.status(401).json({ message: "User Not Found!" });
  }
  const { status } = req.body;

  if (!status) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Something Went Wrong!",
    });
  }

  try {
    // Validate User
    const user = await User.findByPk(uid);
    if (!user) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "User Not Found!",
      });
    }

    // Query filter to fetch user's bookings based on status
    let queryFilter = { add_user_id: uid };

    if (status === "active") {
      queryFilter.book_status = { [Op.notIn]: ["Completed", "Cancelled"] };
    } else if (status === "inactive") {
      queryFilter.book_status = { [Op.in]: ["Completed", "Cancelled"] };
    } else {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Invalid status provided!",
      });
    }

    // Fetch bookings
    const bookings = await TblBook.findAll({
      where: queryFilter,
      order: [["id", "DESC"]],
    });

    const statuswise = [];

    for (const booking of bookings) {
      let totalRate = "5";

      // Calculate the average rating for completed bookings
      const completedBookings = await TblBook.findAll({
        where: {
          prop_id: booking.prop_id,
          book_status: "Completed",
          total_rate: { [Op.ne]: 0 },
        },
      });

      if (completedBookings.length > 0) {
        const avgRate =
          completedBookings.reduce(
            (acc, b) => acc + parseFloat(b.total_rate),
            0
          ) / completedBookings.length;
        totalRate = avgRate.toFixed(0);
      }

      statuswise.push({
        book_id: booking.id,
        prop_id: booking.prop_id,
        prop_img: booking.prop_img,
        prop_title: booking.prop_title,
        p_method_id: booking.p_method_id,
        prop_price: booking.prop_price,
        total_day: booking.total_day,
        rate: totalRate,
        book_status: booking.book_status,
      });
    }

    return res.status(200).json({
      statuswise: statuswise,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Status Wise Property Details Found!",
    });
  } catch (error) {
    console.error("Error fetching bookings by status:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

// Get Booking Details (self & Others)
const getMyUserBookingDetails = async (req, res) => {
  try {
    const uid = req.user.id;
    if (!uid) {
      return sendResponse(res, 401, "false", "User Not Found!");
    }

    const user = await User.findByPk(uid);
    if (!user) {
      return sendResponse(res, 401, "false", "User Not Found!");
    }

    const { book_id } = req.query;

    if (!book_id) {
      return res.status(401).json({
        ResponseCode: "401",
        Result: "false",
        ResponseMsg: "Missing book_id in the query!!",
      });
    }

    const booking = await TblBook.findOne({
      where: {
        id: book_id,
        add_user_id: uid,
      },
    });

    if (!booking) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Booking not found!",
      });
    }

    const paymentDetails = await PaymentList.findOne({
      where: {
        id: booking.p_method_id,
      },
    });

    let customerDetails = {};
    if (booking.book_for === "self") {
      const user = await User.findOne({
        where: {
          id: booking.uid,
        },
      });
      customerDetails = {
        customer_name: user.name,
        customer_mobile: user.ccode + user.mobile,
      };
    } else {
      const person = await PersonRecord.findOne({
        where: {
          book_id: booking.id,
        },
      });
      customerDetails = {
        customer_name: person.fname + " " + person.lname,
        customer_mobile: person.ccode + person.mobile,
      };
    }

    const response = {
      book_id: booking.id,
      prop_id: booking.prop_id,
      uid: booking.uid,
      book_date: booking.book_date,
      check_in: booking.check_in,
      check_out: booking.check_out,
      payment_title: paymentDetails ? paymentDetails.title : "",
      subtotal: booking.subtotal,
      total: booking.total,
      tax: booking.tax,
      cou_amt: booking.cou_amt,
      extra_guest: booking.extra_guest,
      extra_guest_charges: booking.extra_guest_charges,
      transaction_id: booking.transaction_id,
      p_method_id: booking.p_method_id,
      add_note: booking.add_note,
      book_status: booking.book_status,
      check_intime: booking.check_intime || "",
      check_outtime: booking.check_outtime || "",
      book_for: booking.book_for,
      is_rate: booking.is_rate,
      total_rate: booking.total_rate || "",
      rate_text: booking.rate_text || "",
      prop_price: booking.prop_price,
      total_day: booking.total_day,
      cancle_reason: booking.cancle_reason || "",
      ...customerDetails,
    };

    return res.status(200).json({
      bookdetails: response,
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Book Property Details Founded!",
    });
  } catch (error) {
    console.error("Error in getMyBookingDetails:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error",
    });
  }
};

// Cancel a Booking
const myUserCancelBookings = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return res.status(401).json({ message: "User Not Found!" });
  }
  const { book_id, cancle_reason } = req.body;

  // Validate input
  if (!book_id) {
    return res.status(401).json({
      ResponseCode: "401",
      Result: "false",
      ResponseMsg: "Something Went Wrong!",
    });
  }

  try {
    // Update the booking status
    const updated = await TblBook.update(
      {
        book_status: "Cancelled",
        cancle_reason: cancle_reason || "",
      },
      {
        where: {
          id: book_id,
          add_user_id: uid,
          book_status: "Booked",
        },
      }
    );

    if (updated[0] === 0) {
      return res.status(404).json({
        ResponseCode: "404",
        Result: "false",
        ResponseMsg: "Booking not found or already canceled!",
      });
    }

    return res.status(200).json({
      ResponseCode: "200",
      Result: "true",
      ResponseMsg: "Booking Cancelled Successfully!",
    });
  } catch (error) {
    console.error("Error canceling booking:", error);
    return res.status(500).json({
      ResponseCode: "500",
      Result: "false",
      ResponseMsg: "Internal Server Error!",
    });
  }
};

const hostPropertiesBookingStatus = async (req, res) => {
  const hostId = req.user?.id; // Fetch current user ID

  if (!hostId) {
    return res.status(404).json({ message: "User not found!" });
  }

  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "Booking status is required!" });
  }

  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    let whereCondition = { add_user_id: hostId }; // Ensure bookings belong to this host

    // Include traveler details from User table
    const includeCondition = [
      {
        model: Property,
        as: "properties",
        attributes: [
          "id",
          "title",
          "address",
          "price",
          "facility",
          "rules",
          "image",
        ],
      },
      {
        model: User,
        as: "travler_details", // Fetching traveler details from User if booked for self
        attributes: ["id", "name", "mobile", "email"],
      },
      {
        model: PersonRecord,
        as: "travelerDetails", // Fetching traveler details if booked for others
        attributes: ["fname", "mobile", "email"],
      },
      {
        model: User,
        as: "hostDetails", // Fetching host details
        attributes: ["id", "name", "email"],
      },
    ];

    // Define conditions based on booking status
    switch (status) {
      case "current":
        whereCondition = {
          ...whereCondition,
          book_status: "Check_in",
          book_date: { [Op.between]: [startOfDay, endOfDay] },
        };
        break;

      case "active":
        whereCondition = {
          ...whereCondition,
          book_status: "Confirmed",
          book_date: { [Op.between]: [startOfDay, endOfDay] },
        };
        break;

      case "cancelled":
        whereCondition = { ...whereCondition, book_status: "Cancelled" };
        break;

      case "pending":
        whereCondition = { ...whereCondition, book_status: "Booked" };
        break;

      case "past":
        whereCondition = {
          ...whereCondition,
          book_status: { [Op.in]: ["Completed", "Cancelled"] },
        };
        break;

      case "check_in":
        whereCondition = {
          ...whereCondition,
          book_status: "Confirmed",
          check_in: { [Op.between]: [startOfDay, endOfDay] },
        };
        break;

      case "check_out":
        whereCondition = {
          ...whereCondition,
          book_status: "Check_in",
          check_out: { [Op.between]: [startOfDay, endOfDay] },
        };
        break;

      default:
        return res.status(400).json({ message: "Invalid booking status!" });
    }

    // Fetch bookings from the database
    const bookings = await TblBook.findAll({
      where: whereCondition,
      include: includeCondition,
      order: [["id", "DESC"]],
    });

    if (bookings.length === 0) {
      return res
        .status(404)
        .json({ message: `No bookings found for status: ${status}` });
    }

    const travelerIds = bookings
      .map((b) => b.travler_details?.id || null)
      .filter((id) => id !== null);

    // Fetch traveler reviews based on extracted traveler IDs
    const travelerReviews = await HostTravelerReview.findAll({
      where: {
        traveler_id: { [Op.in]: travelerIds },
      },
    });

    // Process booking data to include traveler details
    const processedBookings = bookings.map((booking) => {
      const no_of_days = Math.ceil(
        (new Date(booking.check_out) - new Date(booking.check_in)) /
          (1000 * 60 * 60 * 24)
      );

      // Fetch traveler details from either User or PersonRecord
      const travelerDetails =
        booking.book_for === "self"
          ? booking.traveler
          : booking.travelerDetails;

      // const travelerReview = travelerReviews.filter(
      //   (review) => review.traveler_id === booking.travler_details?.id
      // );
      const travelerName = booking.travler_details?.name || "Unknown";
      const hostName = booking.hostDetails?.name || "Unknown";
      const travelerReview = travelerReviews
        .filter((review) => review.traveler_id === booking.travler_details?.id)
        .map((review) => ({
          traveler_name: travelerName,
          host_name: hostName,
          ...review.toJSON(),
        }));
      return {
        ...booking.toJSON(),
        no_of_days,
        travelerDetails,
        travelerReviews: travelerReview,
      };
    });

    res.status(200).json({
      message: `${
        status.charAt(0).toUpperCase() + status.slice(1)
      } bookings fetched successfully!`,
      bookings: processedBookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const propertyBookingStatus = async (req, res) => {
  const uid = req.user.id;
  if (!uid) {
    return res.status(401).json({ message: "User not found!" });
  }

  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ message: "Booking Status is Required!" });
  }

  try {
    let queryFilter = { uid };
    let includeReviewList = false;

    // Adjust query filters based on status
    if (status === "active") {
      queryFilter.book_status = { [Op.in]: ["Booked"] };
    } else if (status === "Completed") {
      queryFilter.book_status = { [Op.in]: ["Completed"] };
      includeReviewList = true;
    } else if (status === "Cancelled") {
      queryFilter.book_status = { [Op.in]: ["Cancelled"] };
    } else {
      return res.status(400).json({ message: "Invalid status provided!" });
    }

    // Fetch bookings based on query filters
    const bookings = await TblBook.findAll({
      where: queryFilter,
      order: [["id", "DESC"]],
    });

    if (!bookings.length) {
      return res
        .status(404)
        .json({ message: "No bookings found for the specified status!" });
    }

    const bookingDetails = await Promise.all(
      bookings.map(async (booking) => {
        // Fetch the property details
        const property = await Property.findByPk(booking.prop_id, {
          attributes: ["id", "title", "image", "price"],
        });

        if (!property) {
          console.warn(`Property with ID ${booking.prop_id} not found.`);
          return null;
        }

        // Fetch reviews (if needed)
        let reviewList = [];
        let totalReviewCount = 0;

        if (includeReviewList) {
          const reviews = await TblBook.findAll({
            where: {
              prop_id: property.id,
              book_status: { [Op.in]: ["Completed", "Confirmed"] },
              is_rate: 1,
            },
            limit: 3,
          });

          reviewList = await Promise.all(
            reviews.map(async (review) => {
              const userData = await User.findOne({
                where: { id: review.uid },
                attributes: ["pro_pic", "name"],
              });
              return {
                user_img: userData?.pro_pic || null,
                user_title: userData?.name || null,
                user_rate: review.total_rate,
                user_desc: review.rate_text,
              };
            })
          );

          totalReviewCount = await TblBook.count({
            where: {
              prop_id: property.id,
              book_status: "Completed",
              is_rate: 1,
            },
          });
        }

        // Assemble booking details
        return {
          book_id: booking.id,
          prop_id: property.id,
          prop_img: property.image,
          prop_title: property.title,
          book_status: booking.book_status,
          prop_price: booking.prop_price,
          p_method_id: booking.p_method_id,
          total_day: booking.total_day,
          total_rate: booking.total_rate,
          reviews: includeReviewList ? reviewList : undefined,
          total_review_count: includeReviewList ? totalReviewCount : undefined,
        };
      })
    );

    // Filter out any null entries
    const validBookingDetails = bookingDetails.filter(
      (detail) => detail !== null
    );

    return res.status(200).json({
      message: "Status Wise Property Details Found!",
      data: { statuswise: validBookingDetails },
    });
  } catch (error) {
    console.error("Error fetching bookings by status:", error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

// const hostBlockBookingProperty = async (req, res) => {
//   const { prop_id, block_start, block_end, reason } = req.body;
//   const host_id = req.user.id;

//   if (!host_id) {
//     return res.status(401).json({ message: "User not found!" });
//   }

//   if (!prop_id || !block_start || !block_end || !reason) {
//     return res
//       .status(400)
//       .json({ success: false, message: "All fields required!" });
//   }

//   try {
//     // Log prop_id and host_id for debugging purposes
//     console.log(`Blocking property ${prop_id} by host ${host_id}`);

//     // Fetch property details to ensure the host owns the property
//     const property = await Property.findOne({
//       where: { id: prop_id, add_user_id: host_id },
//     });

//     if (!property) {
//       console.log(
//         `No property found for prop_id: ${prop_id} and host_id: ${host_id}`
//       );
//       return res.status(403).json({
//         success: false,
//         message: "You are not authorized to block this property!",
//       });
//     }

//     // Update the Property table with the block_start and block_end dates
//     await Property.update(
//       { block_start, block_end },
//       { where: { id: prop_id } }
//     );

//     console.log(`Property ${prop_id} has been updated with block dates`);

//     // Find all bookings affected by the block
//     const affectedBookings = await TblBook.findAll({
//       where: {
//         prop_id,
//         book_status: { [Op.in]: ["Booked", "Confirmed"] },
//         [Op.or]: [
//           { check_in: { [Op.between]: [block_start, block_end] } },
//           { check_out: { [Op.between]: [block_start, block_end] } },
//           {
//             check_in: { [Op.lte]: block_start },
//             check_out: { [Op.gte]: block_end },
//           },
//         ],
//       },
//     });

//     // Log affected bookings to verify the result
//     console.log("Affected bookings:", affectedBookings);

//     // If no bookings are affected, return early
//     if (affectedBookings.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "No travelers are affected by this block.",
//       });
//     }

//     // Iterate over affected bookings and process each one
//     for (const booking of affectedBookings) {
//       const traveler = await User.findByPk(booking.uid);

//       if (traveler?.one_subscription) {
//         try {
//           console.log(`Notifying traveler ${traveler.email}`);

//           await axios.post(
//             "https://onesignal.com/api/v1/notifications",
//             {
//               app_id: process.env.ONESIGNAL_APP_ID,
//               include_player_ids: [traveler.one_subscription],
//               data: { prop_id, type: "booking_cancellation" },
//               contents: {
//                 en: `Your booking for ${property.title} has been blocked due to: ${reason}`,
//               },
//               headings: { en: "Booking Blocked!" },
//             },
//             {
//               headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
//               },
//             }
//           );

//           await TblNotification.create({
//             uid: traveler.id,
//             datetime: new Date(),
//             title: "Booking Blocked!",
//             description: `Your booking for ${property.title} has been blocked due to: ${reason}`,
//           });

//           // Update booking status to "Blocked"
//           console.log(`Updating booking ${booking.id} to Blocked`);
//           await TblBook.update(
//             { book_status: "Blocked" },
//             { where: { id: booking.id } }
//           );
//           console.log(`Booking ${booking.id} status updated to Blocked`);

//           // Log update result to ensure it's successful
//           console.log(
//             `Booking update result for booking ID ${booking.id}:`,
//             updateResult
//           );
//         } catch (error) {
//           console.error(
//             `Error sending notification to ${traveler.email}:`,
//             error
//           );
//         }
//       }
//     }

//     // Return success response
//     return res.status(200).json({
//       success: true,
//       message:
//         "Affected travelers have been notified, and bookings are blocked.",
//     });
//   } catch (error) {
//     console.error("Error blocking property booking:", error);
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal Server Error!" });
//   }
// };

const hostBlockBookingProperty = async (req, res) => {
  const { prop_id, block_start, block_end, reason } = req.body;
  const host_id = req.user.id;

  if (!host_id) {
    return res.status(401).json({ message: "User not found!" });
  }

  if (!prop_id || !block_start || !block_end || !reason) {
    return res
      .status(400)
      .json({ success: false, message: "All fields required!" });
  }

  try {
    console.log(`Blocking property ${prop_id} by host ${host_id}`);

    const property = await Property.findOne({
      where: { id: prop_id, add_user_id: host_id },
    });

    if (!property) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to block this property!",
      });
    }

    // Use moment.utc without a fixed input format to prevent unwanted timezone shifts
    // const formattedBlockStart = moment.utc(block_start).format("YYYY-MM-DD");
    // const formattedBlockEnd = moment.utc(block_end).format("YYYY-MM-DD");

    const newBlock = await PropertyBlock.create({
      prop_id,
      block_start,
      block_end,
      reason,
    });

    // console.log(
    //   `Property ${prop_id} blocked from ${formattedBlockStart} to ${formattedBlockEnd}`
    // );

    return res.status(200).json({
      success: true,
      message: "Property successfully blocked!",
      data: newBlock,
    });
  } catch (error) {
    console.error("Error blocking property booking:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error!" });
  }
};

module.exports = {
  createBooking,
  editBooking,
  confirmBooking,
  userCheckIn,
  userCheckOut,
  getBookingDetails,
  cancelBooking,
  getTravelerBookingsByStatus,
  hostPropertiesBookingStatus,
  propertyBookingStatus,
  hostBlockBookingProperty,
  cancelTravelerBookingByHost,

  getMyUserBookings,
  getMyUserBookingDetails,
  myUserCancelBookings,
};