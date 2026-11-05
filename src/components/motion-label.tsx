/** The decorative cipher can change without changing the control's name or size. */
export function MotionLabel({children}: {children: string}) {
  return <span className="motion-label"><span>{children}</span><span aria-hidden="true" /></span>;
}
