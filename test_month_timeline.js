// Test script to verify month-based timeline functionality
// This can be run in browser console to test the new functions

console.log("Testing month-based timeline functions...");

// Test getMonthKey function
function testGetMonthKey() {
    console.log("Testing getMonthKey function:");
    const testDates = [
        "2024-01-15",
        "2024-02-28", 
        "2024-12-01",
        "2023-06-10"
    ];
    
    testDates.forEach(date => {
        console.log(`Date: ${date} -> Month Key: ${getMonthKey(date)}`);
    });
}

// Test formatMonthLabel function  
function testFormatMonthLabel() {
    console.log("\nTesting formatMonthLabel function:");
    const testKeys = [
        "2024-01",
        "2024-02", 
        "2024-12",
        "2023-06"
    ];
    
    testKeys.forEach(key => {
        console.log(`Month Key: ${key} -> Label: ${formatMonthLabel(key)}`);
    });
}

// Run tests
try {
    testGetMonthKey();
    testFormatMonthLabel();
    console.log("\nAll tests completed successfully!");
} catch (error) {
    console.error("Test failed:", error);
}