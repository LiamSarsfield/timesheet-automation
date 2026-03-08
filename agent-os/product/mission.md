# Product Mission

## Problem

NAS (National Ambulance Service) staff manually fill out CSV/Excel timesheets each week. This is repetitive, error-prone, and time-consuming — mistakes in time entry, overtime calculations, or formatting delay payroll processing.

## Target Users

All National Ambulance Service staff who submit weekly timesheets.

## Solution

A template-aware web application that:
- Provides a simple web UI where employees enter their hours for each day
- Auto-copies roster to actual — employee adjusts only differences
- Automatically detects and calculates overtime hours when actual shift end exceeds roster
- Prompts for incident details only when overtime is detected
- Generates compliant output matching the exact NAS template format (CSV + Excel)
- Direct download of both CSV and XLSX files from the browser (email integration deferred to future phase)
