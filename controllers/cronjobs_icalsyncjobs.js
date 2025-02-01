import cron from 'node-cron';
import { Property, TblBook } from '../models'; 
import axios from 'axios';
import * as ical from 'node-ical';


const importICal = async (calendarUrl) => {
  try {
    if (!calendarUrl) return [];

    const response = await axios.get(calendarUrl);
    const events = ical.parseICS(response.data);

    return Object.values(events)
      .filter(event => event.start && event.end)
      .map(event => ({
        check_in: new Date(event.start),
        check_out: new Date(event.end),
      }));
  } catch (error) {
    console.error(`Error fetching iCal from ${calendarUrl}:`, error.message);
    return [];
  }
};


const syncBookings = async () => {
  try {
    console.log('Running scheduled iCal sync...');

    
    const properties = await Property.findAll({ where: { calendarUrl: { [Op.ne]: null } } });

    for (const property of properties) {
      const bookings = await importICal(property.calendarUrl);

      if (bookings.length) {
        
        await TblBook.destroy({ where: { prop_id: property.id } });

        
        const formattedBookings = bookings.map(b => ({
          prop_id: property.id,
          check_in: b.check_in,
          check_out: b.check_out,
          add_user_id: null, 
        }));

        await TblBook.bulkCreate(formattedBookings);
        console.log(`Bookings updated for Property ID: ${property.id}`);
      } else {
        console.log(`No valid bookings found for Property ID: ${property.id}`);
      }
    }

    console.log('iCal sync completed.');
  } catch (error) {
    console.error('Error in scheduled iCal sync:', error.message);
  }
};

// Schedule the cron job (Runs every hour)
cron.schedule('0 * * * *', syncBookings);

console.log('iCal sync cron job scheduled to run every hour.');
