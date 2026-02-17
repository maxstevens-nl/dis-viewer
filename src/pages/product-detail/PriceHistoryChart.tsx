import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import type { TimeSeriesEntry, ChartDataEntry } from "./types.ts";

const CHART_HEIGHT = 120;
const CHART_MARGIN = { top: 10, right: 10, left: 10, bottom: 5 };

export function PriceHistoryChart({
  data,
  format = "currency",
  provisionalYear,
}: {
  data: TimeSeriesEntry[];
  format?: "currency" | "number";
  provisionalYear?: number | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(300);
  const [chartHeight, setChartHeight] = useState(CHART_HEIGHT);
  const activeDotY = useRef<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setChartWidth(entry.contentRect.width);
        setChartHeight(entry.contentRect.height || CHART_HEIGHT);
      }
    });

    resizeObserver.observe(containerRef.current);
    setChartWidth(containerRef.current.offsetWidth);
    setChartHeight(containerRef.current.offsetHeight || CHART_HEIGHT);

    return () => resizeObserver.disconnect();
  }, []);

  const plotLeft = CHART_MARGIN.left;
  const plotWidth = chartWidth - CHART_MARGIN.left - CHART_MARGIN.right;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || data.length === 0) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;

      const relativeX = Math.max(0, Math.min(x - plotLeft, plotWidth));
      const indexFloat = (relativeX / plotWidth) * (data.length - 1);
      const index = Math.round(indexFloat);
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));

      setActiveIndex(clampedIndex);
    },
    [data.length, plotLeft, plotWidth]
  );

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const activeData = activeIndex !== null ? data[activeIndex] : null;

  useEffect(() => {
    if (!tooltipRef.current) return;
    const rect = tooltipRef.current.getBoundingClientRect();
    setTooltipSize({ width: rect.width, height: rect.height });
  }, [activeIndex, activeData?.jaar, activeData?.value, format]);

  const hasProvisional =
    provisionalYear &&
    data.length > 0 &&
    data[data.length - 1].jaar === provisionalYear;

  const chartData: ChartDataEntry[] = useMemo(() => {
    if (!hasProvisional) {
      return data.map((d) => ({
        jaar: d.jaar,
        solid: d.value,
        provisional: null,
      }));
    }
    return data.map((d, i) => {
      const isLast = i === data.length - 1;
      const isSecondToLast = i === data.length - 2;
      return {
        jaar: d.jaar,
        solid: isLast ? null : d.value,
        provisional: isSecondToLast || isLast ? d.value : null,
      };
    });
  }, [data, hasProvisional]);

  return (
    <div className="mt-4 -ml-[6px]">
      <div
        ref={containerRef}
        className="h-full relative chart-no-outline"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <LineChart
          data={chartData}
          margin={CHART_MARGIN}
          width={chartWidth}
          height={chartHeight}
        >
          <CartesianGrid vertical={false} stroke="hsl(var(--muted))" />
          <XAxis
            dataKey="jaar"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(value) => value.toString().slice(-2)}
            interval="preserveStartEnd"
          />
          <YAxis hide />
          {activeIndex !== null && (
            <ReferenceLine
              x={chartData[activeIndex].jaar}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          )}
          <Line
            dataKey="solid"
            type="linear"
            stroke="hsl(var(--foreground))"
            strokeWidth={2}
            connectNulls={false}
            dot={(props) => {
              const { cx, cy, index } = props;
              if (cx == null || cy == null) return <></>;
              const isActive = index === activeIndex;
              if (isActive) activeDotY.current = cy;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={isActive ? 6 : 4}
                  fill={
                    isActive
                      ? "hsl(var(--foreground))"
                      : "hsl(var(--background))"
                  }
                  stroke={
                    isActive
                      ? "hsl(var(--background))"
                      : "hsl(var(--foreground))"
                  }
                  strokeWidth={2}
                />
              );
            }}
            activeDot={(props) => {
              const { cx, cy, index } = props;
              if (cx == null || cy == null) return <></>;
              const isActive = index === activeIndex;
              if (isActive) activeDotY.current = cy;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={isActive ? 6 : 4}
                  fill={
                    isActive
                      ? "hsl(var(--foreground))"
                      : "hsl(var(--background))"
                  }
                  stroke={
                    isActive
                      ? "hsl(var(--background))"
                      : "hsl(var(--foreground))"
                  }
                  strokeWidth={2}
                />
              );
            }}
            isAnimationActive={false}
          />
          {hasProvisional && (
            <Line
              dataKey="provisional"
              type="linear"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="4 4"
              connectNulls={false}
              dot={(props) => {
                const { cx, cy, index } = props;
                if (cx == null || cy == null) return <></>;
                const isLast = index === chartData.length - 1;
                if (!isLast) return <></>;
                const isActive = index === activeIndex;
                if (isActive) activeDotY.current = cy;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isActive ? 6 : 4}
                    fill={
                      isActive
                        ? "hsl(var(--muted-foreground))"
                        : "hsl(var(--background))"
                    }
                    stroke={
                      isActive
                        ? "hsl(var(--background))"
                        : "hsl(var(--muted-foreground))"
                    }
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={(props) => {
                const { cx, cy, index } = props;
                if (cx == null || cy == null) return <></>;
                const isLast = index === chartData.length - 1;
                if (!isLast) return <></>;
                const isActive = index === activeIndex;
                if (isActive) activeDotY.current = cy;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isActive ? 6 : 4}
                    fill={
                      isActive
                        ? "hsl(var(--muted-foreground))"
                        : "hsl(var(--background))"
                    }
                    stroke={
                      isActive
                        ? "hsl(var(--background))"
                        : "hsl(var(--muted-foreground))"
                    }
                    strokeWidth={2}
                  />
                );
              }}
              isAnimationActive={false}
            />
          )}
        </LineChart>

        {activeData &&
          (() => {
            const dotY = activeDotY.current ?? chartHeight / 2;
            const gap = 10;
            const above = dotY - tooltipSize.height - gap;
            const below = dotY + gap;
            const top = above >= 0
              ? above
              : Math.min(below, chartHeight - tooltipSize.height);
            const rawLeft =
              plotLeft + (activeIndex! / (data.length - 1)) * plotWidth;
            const left = Math.min(
              Math.max(rawLeft, tooltipSize.width / 2 + 4),
              chartWidth - tooltipSize.width / 2 - 4
            );
            return (
              <div
                ref={tooltipRef}
                className="absolute rounded-lg border bg-background px-2 py-1 text-xs shadow-md pointer-events-none whitespace-nowrap w-max"
                style={{
                  left,
                  top: Math.max(0, top),
                  transform: "translateX(-50%)",
                }}
              >
                <p className="font-medium">{activeData.jaar}</p>
                <p className="font-mono whitespace-nowrap">
                  {format === "currency" ? "€ " : ""}
                  {activeData.value.toLocaleString("nl-NL", {
                    minimumFractionDigits: format === "currency" ? 2 : 0,
                    maximumFractionDigits: format === "currency" ? 2 : 0,
                  })}
                </p>
              </div>
            );
          })()}
      </div>
    </div>
  );
}
