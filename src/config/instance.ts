import axios from "axios";
import { ErrorResponse } from "../templates/response";

const instance = axios.create({
  baseURL: process.env.BASE_URL,
  params: {
    api_token: process.env.SPORTS_MONK_TOKEN,
  },
});

const successStatusList = [200, 201, 202, 203, 204];

instance.interceptors.response.use((response) => {
  if (response.status && !successStatusList.includes(response.status)) {
    throw new Error(
      JSON.stringify(
        ErrorResponse(
          response.data?.message || "Something went wrong",
          response.status
        )
      )
    );
  }
  return response.data;
});

instance.interceptors.request.use((config) => {
  return config;
});

export default instance;
