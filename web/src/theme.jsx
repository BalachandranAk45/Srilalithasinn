import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  },
  colors: {
    brand: {
      500: "#2C7A7B", // teal shade for brand
      600: "#285E61",
    },
  },
});

export default theme;
