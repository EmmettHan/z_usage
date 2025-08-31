# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a local-deployed web application for visualizing 智谱AI开放平台 (Zhipu AI Open Platform) fee明细 data. The application focuses on Token usage analysis with interactive charts and filtering capabilities.

## Quick Start Commands

```bash
# Start the development server
./start.sh

# Or manually start Python HTTP server
python3 -m http.server 8000

# Access the application
open http://localhost:8000
```

## Architecture Overview

The application follows a modular JavaScript architecture with clear separation of concerns:

### Core Modules

**App Class (`js/main.js`)**
- Main application controller that orchestrates all modules
- Handles file upload events and coordinates data flow
- Manages UI state and user interactions
- Implements error handling and loading states

**DataProcessor Class (`js/dataProcessor.js`)**
- Handles Excel file parsing using SheetJS
- Implements data cleaning and transformation
- Provides time-based and product-based data aggregation
- Includes intelligent caching mechanism for performance

**FilterManager Class (`js/filterManager.js`)**
- Manages filter state and UI components
- Handles time range (daily/weekly/monthly) filtering
- Manages product type multi-selection filtering
- Provides filter persistence using localStorage

**ChartRenderer Class (`js/chartRenderer.js`)**
- Manages Chart.js instances and rendering
- Supports line charts (time trends) and bar charts (product comparison)
- Handles dynamic chart type switching
- Implements responsive chart sizing

### Data Flow

```
Excel Upload → DataProcessor → FilterManager → ChartRenderer → UI Display
     ↓              ↓              ↓              ↓              ↓
File Parsing → Data Cleaning → Filtering → Chart Creation → User Interface
```

## Key Dependencies

- **Bootstrap 5.x**: UI framework and responsive grid system
- **Chart.js**: Chart rendering library for data visualization
- **SheetJS (xlsx.full.min.js)**: Excel file parsing and data extraction
- **No build tools**: Pure frontend application with direct browser execution

## Data Structure

The application processes Excel files with the following key fields:
- `账期` (Billing Period) - Date/time data for time-based analysis
- `模型产品名称` (Model Product Name) - Product categorization
- `抵扣用量` (Deducted Usage) - Primary metric for Token usage analysis

## Performance Characteristics

- **Data Volume**: Supports 1,000-5,000 records
- **File Size**: Maximum 10MB Excel files
- **Processing Time**: <2 seconds for data processing
- **Rendering Time**: <1 second for chart rendering
- **Caching**: Implements Map-based caching to avoid redundant calculations

## Module Interactions

### Event Flow
1. User uploads Excel file via file input
2. App triggers DataProcessor.parseExcel()
3. Processed data flows to FilterManager for initialization
4. FilterManager updates UI filter components
5. App requests ChartRenderer to create initial chart
6. User interactions trigger filter updates and chart re-rendering

### State Management
- Application state is managed within the App class instance
- Filter state is persisted in localStorage for user convenience
- Chart instances are managed by ChartRenderer to prevent memory leaks
- Data caching is handled by DataProcessor for performance optimization

## Code Conventions

### JavaScript Style
- Uses ES6+ features (classes, arrow functions, destructuring)
- Follows camelCase naming convention for variables and functions
- Uses PascalCase for class names
- Implements comprehensive error handling with try-catch blocks
- Uses async/await for asynchronous operations

### Module Pattern
- Each module is implemented as a class with clear responsibilities
- Modules communicate through well-defined APIs
- Event-driven architecture for loose coupling
- Dependency injection for testability

## Development Guidelines

### Adding New Features
1. **Data Processing**: Extend DataProcessor class for new data transformations
2. **UI Components**: Add to index.html and style in css/style.css
3. **Filtering**: Extend FilterManager class for new filter types
4. **Charts**: Add new chart types to ChartRenderer class
5. **Integration**: Update App class to coordinate new functionality

### Performance Considerations
- Use DataProcessor's caching mechanism for expensive operations
- Implement debouncing for frequent user interactions
- Clean up Chart instances when switching chart types
- Use efficient DOM manipulation techniques

### Error Handling
- Validate file types and sizes before processing
- Provide user-friendly error messages in Chinese
- Implement graceful degradation for missing browser features
- Log technical errors to console for debugging

## Testing Strategy

The application includes comprehensive test coverage:
- **Unit Tests**: Individual component testing
- **Integration Tests**: Module interaction testing
- **Performance Tests**: Large dataset handling
- **User Interface Tests**: Responsive design validation

### Test Execution
```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:performance

# Generate coverage report
npm run test:coverage
```

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Support**: Responsive design for tablets and smartphones
- **File API**: Requires FileReader API support
- **Local Storage**: Used for filter state persistence

## Security Considerations

- **Local Processing**: All data processing happens client-side
- **No External Calls**: Application works completely offline after loading
- **File Validation**: Validates file types and sizes before processing
- **Input Sanitization**: Cleans data to prevent XSS vulnerabilities

## Common Development Tasks

### Adding New Chart Types
1. Add chart creation method to ChartRenderer class
2. Update chart type switching logic
3. Add UI controls for new chart type
4. Update App class event handlers

### Extending Data Processing
1. Add new aggregation methods to DataProcessor
2. Update data cleaning logic if needed
3. Add corresponding filter options to FilterManager
4. Test with various data scenarios

### UI Modifications
- Follow Bootstrap 5 component patterns
- Use existing CSS custom properties for consistency
- Test responsive behavior across device sizes
- Maintain accessibility standards