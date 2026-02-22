interface Props {
  children: string;
  className?: string;
  color?: "primary" | "secondary" | "danger";
  onClick?: () => void;
}

const Button = ({ children, className, color = "primary", ...props }: Props) => {
  const buttonColor = "btn btn-" + color;
  return (
    <>
      <button type="button" className={buttonColor + " " + className} {...props}>
        {children}
      </button>
    </>
  );
};

export default Button;
