import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Geocode an address string to latitude and longitude using Google Maps API
 * @param address Full address string
 * @returns Object containing lat and lng, or null if failed
 */
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not configured, skipping geocoding');
      return null;
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    } else {
      console.warn('Geocoding failed', { status: data.status, errorMessage: data.error_message, address });
      return null;
    }
  } catch (error) {
    console.error('Error geocoding address', { error });
    return null;
  }
}

async function main() {
  console.log('Starting geocoding backfill...');
  
  const orders = await prisma.order.findMany({
    where: {
      deliveryAddress: { not: '' },
      latitude: null,
    },
  });

  console.log(`Found ${orders.length} orders to geocode.`);

  for (const order of orders) {
    try {
      const fullAddress = `${order.deliveryAddress}, ${order.deliveryCity}, ${order.deliveryZip}`;
      console.log(`Geocoding: ${fullAddress}`);
      
      const coordinates = await geocodeAddress(fullAddress);
      
      if (coordinates) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            latitude: coordinates.lat,
            longitude: coordinates.lng,
          },
        });
        console.log(`Updated order ${order.orderNumber} with coordinates.`);
      } else {
        console.log(`Could not geocode order ${order.orderNumber}.`);
      }
      
      // Rate limiting to avoid hitting API limits
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`Error processing order ${order.orderNumber}:`, error);
    }
  }

  console.log('Backfill complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
