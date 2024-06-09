import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, RouterProvider } from "react-router-dom"; // Import BrowserRouter
import router from "./router";

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <RouterProvider router={router} />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);