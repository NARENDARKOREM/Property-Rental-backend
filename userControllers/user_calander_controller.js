const express = require('express');
const { Op } = require('sequelize');
const bodyParser = require('body-parser');
const { Booking } = require('./models'); 

const app = express();

app.use(bodyParser.json());


function getDatesFromRange(start, end) {
    const dates = [];
    let currentDate = new Date(start);
    const endDate = new Date(end);

    while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}

// API Route
app.post('/getBookedDates', async (req, res) => {
    const { uid, property_id } = req.body;

    if (!uid || !property_id) {
        return res.status(401).json({
            ResponseCode: "401",
            Result: "false",
            ResponseMsg: "Something Went Wrong!"
        });
    }

    try {
        const bookings = await Booking.findAll({
            where: {
                prop_id: property_id,
                book_status: {
                    [Op.not]: 'Cancelled'
                }
            },
            attributes: ['check_in', 'check_out']
        });

        if (bookings.length > 0) {
            let dateList = [];

            bookings.forEach(({ check_in, check_out }) => {
                dateList = dateList.concat(getDatesFromRange(check_in, check_out));
            });

            // Remove duplicates and sort the dates
            dateList = [...new Set(dateList)].sort();

            return res.status(200).json({
                datelist: dateList,
                ResponseCode: "200",
                Result: "true",
                ResponseMsg: "Book Date List Founded!"
            });
        } else {
            return res.status(200).json({
                datelist: [],
                ResponseCode: "200",
                Result: "false",
                ResponseMsg: "Book Date List Not Founded!"
            });
        }
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return res.status(500).json({
            ResponseCode: "500",
            Result: "false",
            ResponseMsg: "Internal Server Error"
        });
    }
});



