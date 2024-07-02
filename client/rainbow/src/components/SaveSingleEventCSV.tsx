const SaveSingleEventCSV: React.FC<{ event: Event }> = ({ event }) => {
    const downloadCSV = () => {
      const csvContent = Object.keys(event).join(',') + '\n' + Object.values(event).join(',');
  
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.eventCode}_event.csv`; // Example: eventCode_event.csv
      a.click();
      URL.revokeObjectURL(url);
    };
  
    return (
      <button onClick={downloadCSV}>Download CSV</button>
    );
  };
  