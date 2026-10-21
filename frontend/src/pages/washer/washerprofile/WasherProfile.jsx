import AccountProfile from "../../../components/common/AccountProfile";
import PayoutDetails from "./PayoutDetails";
import WasherLocation from "./WasherLocation";
export default function WasherProfile() {
  return <AccountProfile><WasherLocation /><PayoutDetails /></AccountProfile>;
}
