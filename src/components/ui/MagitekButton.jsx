import buttonStyles from '../../styles/modules/MagitekButton.module.css';

/**
 * MagitekButton
 * - CSS Modules only (strict isolation)
 * - Variants: primary | ghost
 */
export function MagitekButton({
  variant = 'primary',
  size = 'default',
  className = '',
  type = 'button',
  disabled = false,
  onClick,
  children,
  ...rest
}) {
  const variantClass =
    variant === 'ghost' ? buttonStyles.ghostButton : buttonStyles.primaryButton;
  const sizeClass = size === 'small' ? buttonStyles.sizeSmall : '';

  return (
    <button
      type={type}
      className={`${buttonStyles.buttonBase} ${sizeClass} ${variantClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}

export default MagitekButton;

