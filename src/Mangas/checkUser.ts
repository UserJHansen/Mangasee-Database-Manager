import LoggingModel from '../Logging/Log.model';
import UserModel, { User } from '../Users/User.model';

export default async function checkUser(userDetails: User) {
  const { id, username } = userDetails;
  const user = await UserModel.findByPk(id);
  if (user !== null) {
    if (user.username !== username) {
      await LoggingModel.create({
        type: 'Username Update',
        value: username,
        previousValue: user.username,
        targetID: id.toString(),
      });
      await user.update({ username });
    }
  } else {
    await UserModel.create(userDetails);
  }
}
