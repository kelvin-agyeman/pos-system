import axios from "axios";

const customFetch = axios.create({
  baseURL: `${import.meta.env.PROD ? import.meta.env.SERVER_URL : ""}/api/v1`,
  withCredentials: true,
});

export default customFetch;
