import React from "react";

type DownEvent = React.MouseEvent | React.TouchEvent;

interface RepeatButtonProps extends React.ComponentProps<"button"> {
  /**
   * Return `true` / `void` to continue repeating, `false` to stop
   */
  onTrigger: (originalEvent: DownEvent) => boolean | void;
}
const INITIAL_HOLD_DELAY_MS = 300;
const HOLD_INTERVAL_MS = 1000 / 60;

/**
 * A `<button>` that repeats an action when held down
 */
export function RepeatButton({ onTrigger, ...props }: RepeatButtonProps) {
  const [holding, setHolding] = React.useState(false);
  const lastEventRef = React.useRef<DownEvent | null>(null);

  const onTriggerRef = React.useRef(onTrigger);
  React.useEffect(() => {
    onTriggerRef.current = onTrigger;
  }, [onTrigger]);

  React.useEffect(() => {
    if (!holding || !lastEventRef.current) {
      return;
    }

    const event = lastEventRef.current;

    let timer = setTimeout(() => {
      const onTick = () => {
        if (onTriggerRef.current(event) !== false) {
          timer = setTimeout(onTick, HOLD_INTERVAL_MS);
        }
      };
      onTick();
    }, INITIAL_HOLD_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [holding]);

  function start(e: DownEvent) {
    if (onTriggerRef.current(e) !== false) {
      lastEventRef.current = e;
      setHolding(true);
    }
  }

  function stop() {
    lastEventRef.current = null;
    setHolding(false);
  }

  return (
    <button
      {...props}
      onMouseDown={(e) => {
        start(e);
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        stop();
        props.onMouseUp?.(e);
      }}
      onMouseLeave={(e) => {
        stop();
        props.onMouseLeave?.(e);
      }}
      onTouchStart={(e) => {
        start(e);
        props.onTouchStart?.(e);
      }}
      onTouchEnd={(e) => {
        stop();
        props.onTouchEnd?.(e);
      }}
    />
  );
}
