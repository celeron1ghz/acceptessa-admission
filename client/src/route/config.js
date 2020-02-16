export default {
  endpoint: process.env.NODE_ENV === "production"
    ? window.location.protocol + "//" + window.location.hostname + "/dev/endpoint"
    : window.location.protocol + "//" + window.location.hostname + ":3200/endpoint"
}