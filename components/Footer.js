import React from "react";
import { Box, Typography, Link as MuiLink } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";

const Footer = () => {
  const router = useRouter();

  // Hide footer on specific embedded routes if desired
  if (router.query.embed === "true") return null;

  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        py: 3,
        px: 2,
        backgroundColor: "#f5f5f5",
        textAlign: "center",
        borderTop: "1px solid #e0e0e0",
      }}
    >
      <Typography
        variant="body2"
        color="textSecondary"
        sx={{
          mb: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
        }}
      >
        <MuiLink
          href="https://codea11y.dev/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            height="40"
            preserveAspectRatio="xMinYMin meet"
            viewBox="0 0 219.28917 54.354222"
            role="img"
            aria-label="codea11y homepage"
            className="logo-svg"
          >
            <g transform="translate(-4.830636,-114.42924)">
              <g>
                <g>
                  <path
                    className="logo-blue"
                    style={{
                      strokeWidth: 1.854,
                      strokeDasharray: "none",
                      strokeOpacity: 1,
                      fillOpacity: 1,
                    }}
                    d="m 32.129858,122.1698 -15.070225,0.0842 c -3.031204,0.0171 -5.877333,1.21638 -8.0141633,3.37718 -2.13683,2.1608 -3.304398,5.02022 -3.2876573,8.05159 0.035039,6.2668 5.1618916,11.33678 11.4287756,11.30199 l 15.070057,-0.0842 c 3.031287,-0.017 5.877668,-1.21639 8.014498,-3.37719 2.136831,-2.1608 3.304397,-5.02038 3.287489,-8.05159 -0.01698,-3.03128 -1.2163,-5.87758 -3.377101,-8.01441 -2.160718,-2.13691 -5.020217,-3.3044 -8.051673,-3.28757 z m -15.038534,5.73559 15.070139,-0.0843 c 3.150719,-0.0175 5.728314,2.53152 5.746056,5.68215 0.01724,3.1508 -2.531929,5.72857 -5.682312,5.74605 l -7.53507,0.0421 8.4e-5,7e-5 -7.535071,0.042 c -3.150718,0.0175 -5.728313,-2.53151 -5.745971,-5.68222 -0.01758,-3.1508 2.531425,-5.7284 5.682145,-5.74589 z"
                  ></path>
                  <path
                    className="logo-red"
                    style={{
                      strokeWidth: 1.854,
                      strokeDasharray: "none",
                      strokeOpacity: 1,
                      fillOpacity: 1,
                    }}
                    d="m 87.072129,121.95413 -15.070225,0.084 c -3.031286,0.017 -5.877498,1.21638 -8.014329,3.37718 -2.136831,2.1608 -3.30448,5.0203 -3.287571,8.0515 0.01691,3.03138 1.216215,5.87768 3.377016,8.01451 2.160885,2.13691 5.020386,3.30456 8.051757,3.28748 l 15.070057,-0.084 c 3.031287,-0.017 5.877669,-1.21622 8.0145,-3.37702 2.136832,-2.1608 3.304398,-5.02038 3.287405,-8.05168 -0.01698,-3.03129 -1.21622,-5.87766 -3.377019,-8.0145 -2.160801,-2.13682 -5.020132,-3.30431 -8.051591,-3.28749 z m 0.09527,17.07932 -7.53507,0.0421 -7.535069,0.0419 c -3.150723,0.0177 -5.728401,-2.53143 -5.745976,-5.68223 -0.0176,-3.15063 2.531427,-5.72823 5.682145,-5.74588 l 15.070143,-0.0841 c 3.150719,-0.0175 5.728312,2.53151 5.745972,5.68222 0.01764,3.15089 -2.531262,5.7284 -5.682145,5.7459 z"
                  ></path>
                  <g
                    className="logo-orange"
                    style={{
                      strokeWidth: 0.512326,
                      strokeDasharray: "none",
                      strokeOpacity: 1,
                      fillOpacity: 1,
                    }}
                    transform="matrix(3.6187955,0,0,3.6187955,30.416506,115.35624)"
                  >
                    <path
                      d="M 5.900404,10.015618 5.576408,13.103049 C 5.5186786,13.653166 5.026617,14.052252 4.4773577,13.994432 3.9280984,13.936613 3.5296348,13.443782 3.5873642,12.893665 L 4.3098044,6.009371 H 1 C 0.44771525,6.009371 0,5.5609565 0,5.0078091 0,4.4546618 0.44771525,4.0062473 1,4.0062473 h 10 c 0.552285,0 1,0.4484145 1,1.0015618 0,0.5531474 -0.447715,1.0015619 -1,1.0015619 H 7.6901956 l 0.7224402,6.884294 C 8.4703652,13.443782 8.0719016,13.936613 7.5226423,13.994432 6.973383,14.052252 6.4813214,13.653166 6.423592,13.103049 L 6.099596,10.015618 Z M 6,4.0062473 c -1.1045695,0 -2,-0.896829 -2,-2.0031236 C 4,0.89682901 4.8954305,0 6,0 7.1045695,0 8,0.89682901 8,2.0031237 8,3.1094183 7.1045695,4.0062473 6,4.0062473 Z"
                      style={{
                        strokeWidth: 0.512326,
                        strokeDasharray: "none",
                        strokeOpacity: 1,
                        fillOpacity: 1,
                      }}
                    ></path>
                  </g>
                </g>
                <text
                  xmlSpace="preserve"
                  style={{
                    fontSize: "26.1897px",
                    lineHeight: 1.25,
                    fontFamily: "VT323",
                    letterSpacing: "0px",
                    strokeWidth: 0.30691,
                  }}
                  fill="currentColor"
                  x="71.983971"
                  y="163.30981"
                >
                  <tspan
                    style={{
                      fontStyle: "normal",
                      fontVariant: "normal",
                      fontWeight: "normal",
                      fontStretch: "normal",
                      fontSize: "26.1897px",
                      fontFamily: "Cal Sans",
                      strokeWidth: 0.30691,
                    }}
                    fill="currentColor"
                    x="71.983971"
                    y="163.30981"
                  >
                    codea11y.dev
                  </tspan>
                </text>
              </g>
            </g>
          </svg>
        </MuiLink>
        <MuiLink
          href="https://buymeacoffee.com/danwestfalb"
          target="_blank"
          rel="noopener noreferrer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bmc-button.svg"
            alt="Buy Me a Coffee"
            style={{ height: "40px" }}
          />
        </MuiLink>
      </Typography>

      <Typography variant="body2" color="textSecondary">
        <MuiLink component={Link} href="/help" sx={{ mx: 1 }}>
          Help
        </MuiLink>
        |
        <MuiLink component={Link} href="/about" sx={{ mx: 1 }}>
          About
        </MuiLink>
      </Typography>
    </Box>
  );
};

export default Footer;
