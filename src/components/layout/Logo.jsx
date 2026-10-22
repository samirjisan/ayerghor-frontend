import { Link } from 'react-router-dom';
import logo from '../../assets/logo.jpg';

export default function Logo() {
  return (
    <Link to="/" className="navbar__logo" aria-label="AyerGhor home">
      <img src={logo} alt="AyerGhor" />
    </Link>
  );
}
