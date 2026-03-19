@echo off
REM SweetTooth Gelato - Build Script (Windows)
REM Minifies CSS and JS files and generates size comparison report

echo ======================================
echo SweetTooth Build Script
echo ======================================
echo.

REM Function to get file size
:getFileSize
for %%A in (%1) do set %2=%%~zA
goto :eof

echo Starting minification process...
echo.

REM Note: For production, use proper minification tools like:
REM - CSS: cssnano, clean-css
REM - JS: terser, uglify-js
REM This script copies files as placeholder for actual minification

echo Minifying CSS...
REM In production, replace with actual minification command
REM Example: npx clean-css-cli -o assets/css/shared.min.css assets/css/shared.css
echo CSS minification placeholder (install clean-css-cli for production)
echo.

echo Minifying JS...
REM In production, replace with actual minification command
REM Example: npx terser assets/js/cart.js -o assets/js/cart.min.js
echo JS minification placeholder (install terser for production)
echo.

echo ======================================
echo Size Comparison Report
echo ======================================
echo.

REM Get file sizes
call :getFileSize "Sweettooth\assets\css\shared.css" CSS_ORIGINAL
call :getFileSize "Sweettooth\assets\css\shared.min.css" CSS_MINIFIED
call :getFileSize "Sweettooth\assets\js\cart.js" JS_ORIGINAL
call :getFileSize "Sweettooth\assets\js\cart.min.js" JS_MINIFIED

REM Calculate savings
set /a CSS_SAVED=%CSS_ORIGINAL% - %CSS_MINIFIED%
if %CSS_ORIGINAL% GTR 0 (
    set /a CSS_PERCENT=%CSS_SAVED% * 100 / %CSS_ORIGINAL%
) else (
    set CSS_PERCENT=0
)

set /a JS_SAVED=%JS_ORIGINAL% - %JS_MINIFIED%
if %JS_ORIGINAL% GTR 0 (
    set /a JS_PERCENT=%JS_SAVED% * 100 / %JS_ORIGINAL%
) else (
    set JS_PERCENT=0
)

set /a TOTAL_ORIGINAL=%CSS_ORIGINAL% + %JS_ORIGINAL%
set /a TOTAL_MINIFIED=%CSS_MINIFIED% + %JS_MINIFIED%
set /a TOTAL_SAVED=%TOTAL_ORIGINAL% - %TOTAL_MINIFIED%
if %TOTAL_ORIGINAL% GTR 0 (
    set /a TOTAL_PERCENT=%TOTAL_SAVED% * 100 / %TOTAL_ORIGINAL%
) else (
    set TOTAL_PERCENT=0
)

echo CSS (shared.css):
echo   Original:  %CSS_ORIGINAL% bytes
echo   Minified:  %CSS_MINIFIED% bytes
echo   Saved:     %CSS_SAVED% bytes (%CSS_PERCENT%%% reduction)
echo.

echo JavaScript (cart.js):
echo   Original:  %JS_ORIGINAL% bytes
echo   Minified:  %JS_MINIFIED% bytes
echo   Saved:     %JS_SAVED% bytes (%JS_PERCENT%%% reduction)
echo.

echo ======================================
echo TOTAL:
echo   Original:  %TOTAL_ORIGINAL% bytes
echo   Minified:  %TOTAL_MINIFIED% bytes
echo   Saved:     %TOTAL_SAVED% bytes (%TOTAL_PERCENT%%% reduction)
echo ======================================
echo.

echo Build complete!
echo.
pause
