const AddressIcon = ({ className = "h-3.5 w-3.5 text-gray-400" }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.75 8.5L10 3.75L16.25 8.5V15.5C16.25 15.9142 15.9142 16.25 15.5 16.25H4.5C4.08579 16.25 3.75 15.9142 3.75 15.5V8.5Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      d="M8 16.25V12.75C8 12.3358 8.33579 12 8.75 12H11.25C11.6642 12 12 12.3358 12 12.75V16.25"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
);

export default AddressIcon;
