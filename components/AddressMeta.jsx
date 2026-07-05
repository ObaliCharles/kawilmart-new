import AddressIcon from "./AddressIcon";

const AddressMeta = ({
  children,
  className = "",
  textClassName = "",
  iconClassName = "",
}) => (
  <div className={`flex min-w-0 items-center gap-1.5 ${className}`.trim()}>
    <AddressIcon className={`h-3.5 w-3.5 shrink-0 text-gray-400 ${iconClassName}`.trim()} />
    <span className={`min-w-0 ${textClassName}`.trim()}>{children}</span>
  </div>
);

export default AddressMeta;
