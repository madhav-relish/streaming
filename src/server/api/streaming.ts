import { Configuration, Client } from "streaming-availability";

const apiKey = process.env.STREAMING_API_KEY;

if (!apiKey) {
  throw new Error("STREAMING_API_KEY is not defined in the environment variables.");
}

const client = new Client(new Configuration({ apiKey }));

export const getStreamingData = async (id: string, country: string) => {
  try {
    const show = await client.showsApi.getShow({ id, country });
    return show;
  } catch (error) {
    console.error("Error fetching streaming data:", error);
    throw error;
  }
};