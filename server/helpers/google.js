import NodeGeocoder from "node-geocoder";
const geocoder = NodeGeocoder({
  provider: "google",
  apiKey: process.env.GOOGLE_MAP_API_KEY,
  formatter: null,
});
export const geocodeAddress = async (address) => {
  console.log("Geocoding address:", address); // Log the address input
  try {
    const geo = await geocoder.geocode(address);
    console.log("Geocoder response:", geo); // Log the geocoder response
    if (!geo || !geo[0]?.longitude || !geo[0]?.latitude) {
      throw new Error("Please enter a valid address, suburb, or city");
    }
    return {
      location: {
        type: "Point",
        coordinates: [geo[0].longitude, geo[0].latitude],
      },
      googleMap: geo, // Store the geocoder response for later use
    };
  } catch (error) {
    console.error("Error geocoding address:", error.message);
    throw new Error("Geocoding failed. Please try again later.");
  }
};
