# Time Loss Field Validation Documentation

## Overview
The Time Loss field has been updated to accept only timing-related entries, not alphabetical text or arbitrary strings.

## Valid Time Loss Formats

### Simple Formats
- `15 min` - 15 minutes
- `30 minutes` - 30 minutes  
- `2 hours` - 2 hours
- `1 hour` - 1 hour
- `45 mins` - 45 minutes (abbreviated)
- `3 hrs` - 3 hours (abbreviated)
- `120 m` - 120 minutes (short form)
- `5 h` - 5 hours (short form)

### Complex Formats (Enhanced)
- `1 hour 30 minutes` - 1 hour and 30 minutes
- `2hrs 15min` - 2 hours and 15 minutes
- `1hr 45mins` - 1 hour and 45 minutes

## Invalid Formats (Will be Rejected)
❌ `abc minutes` - Contains non-numeric characters
❌ `system delay` - Not a time format
❌ `network issues` - Descriptive text
❌ `15` - Missing time unit
❌ `minutes 30` - Wrong order
❌ `very long delay` - Descriptive text
❌ `30 seconds` - Seconds not supported (use minutes/hours only)

## Technical Implementation

### Frontend Validation
- **Input Type**: Text input field (not textarea)
- **Validation**: Real-time JavaScript validation with visual feedback
- **Pattern**: Supports both simple and complex time formats
- **Feedback**: Red border for invalid entries, clear border for valid entries

### Backend Storage
- **Database Field**: `time_loss TEXT` column in `cvar_all.db` and `cvar_nyq.db`
- **Storage**: Stores the exact user input (e.g., "15 min", "2 hours")
- **Collection**: Multiple Time Loss entries from different cards are joined with semicolons

### Form Integration
- **Location**: Inside "Additional Items (Issues, PRBs, HIIMs, Time Loss)" cards
- **Position**: Between Issue and PRB sections in each card
- **Behavior**: Each card can have its own Time Loss entry
- **Combination**: All Time Loss entries are combined when saving

## User Experience

### Adding New Entry
1. Click "Enable Edit" → "Add New Entry"
2. Click "+ Add Item Card" 
3. Fill in Issue Description (if needed)
4. Enter Time Loss in proper format (e.g., "30 min")
5. The field will validate in real-time

### Editing Existing Entry
1. Click Edit on an entry
2. Time Loss data appears in the first card
3. Can be modified with proper time format validation

### Visual Feedback
- ✅ **Valid Entry**: Normal border, no error message
- ❌ **Invalid Entry**: Red border, error message on form submission

## Examples for Users

### ✅ Good Examples
```
15 min
30 minutes
2 hours
1 hour 30 minutes
45 mins
3 hrs
120 minutes
1hr 15min
```

### ❌ Bad Examples  
```
fifteen minutes (use numbers)
system was down (use time format)
network delay (use time format)
30 (missing unit)
```

## Benefits
1. **Consistent Data**: All time loss entries follow the same format
2. **Easy Analysis**: Time-based data can be processed programmatically
3. **User Clarity**: Clear expectations for data entry format
4. **Data Quality**: Prevents arbitrary text that doesn't represent time

## Migration
- Existing entries with non-time format Time Loss data will still display
- New entries must follow the time format validation rules
- Users will be guided to use proper time formats going forward