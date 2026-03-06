import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/vote", "routes/api.vote.tsx"),
] satisfies RouteConfig;
