function resolveApiHost(hostname: string): string {
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "localhost";
  }

  if (hostname === "192.168.1.30") {
    return "192.168.1.243";
  }

  if (hostname === "192.168.1.243" || hostname === "192.168.30.1") {
    return hostname;
  }

  return hostname || "localhost";
}

const currentHost = typeof window !== "undefined" && window.location?.hostname
  ? window.location.hostname
  : "localhost";

export const environment = {
  production: false,
  apiUrl: `http://${resolveApiHost(currentHost)}:3000`
};
