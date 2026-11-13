import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  createEnrollmentHistoryChartData,
  formatDateCreated,
  formatEnrollmentTooltip,
  lineColors as defaultLineColors,
} from "main/components/EnrollmentHistory/EnrollmentHistoryHelper";

const totalEnrollmentLineColor = "#dc3545";

const EnrollmentHistoryGraph = ({
  data = [],
  lineColors = defaultLineColors,
  title = "Enrollment History",
  includeTotalEnrollment = false,
}) => {
  const { chartData, series } = createEnrollmentHistoryChartData(data, {
    includeTotalEnrollment,
  });

  return (
    <div data-testid="enrollment-history-graph">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          // Stryker disable all
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <XAxis dataKey="dateCreated" tickFormatter={formatDateCreated} />
          <YAxis allowDecimals={false} />
          <Legend />
          <Tooltip
            formatter={formatEnrollmentTooltip}
            labelFormatter={formatDateCreated}
          />
          {series.map((line, index) => (
            <Line
              key={line.dataKey}
              dataKey={line.dataKey}
              name={line.name}
              stroke={
                line.dataKey === "totalEnrollment"
                  ? totalEnrollmentLineColor
                  : lineColors[index % lineColors.length]
              }
              strokeWidth={2}
              dot
              connectNulls
              // Stryker restore all
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EnrollmentHistoryGraph;
