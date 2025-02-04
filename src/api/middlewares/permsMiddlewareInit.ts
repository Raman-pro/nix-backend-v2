import CustomError from "../../config/CustomError";
import { assertProtectedUser } from "../helpers/assertions";
import asyncErrorHandler from "../helpers/asyncErrorHandler";
import StatusCode from "static/types/backend/httpStatusCode";
import Permission from "static/types/permissions";
import * as UserService from "../services/userService";

/**
 * This generates a middleware to check for certain given permissions
 *
 * Note: This is not a middleware in itself
 *
 * @export
 * @param {Permission[]} permissions_required An array of permissions required
 * @returns Middleware function
 */
export default function protected_route(permissions_required: Permission[]) {
  const protect = asyncErrorHandler(async (req, res, next) => {
    if (!permissions_required) {
      // no permissions required is a no-op
      return next();
    }
    assertProtectedUser(res);
    const user_id = res.locals.user_id;
    if (!user_id) {
      const err = new CustomError("Not authorized", StatusCode.UNAUTHORIZED);
      return next(err);
    }
    const user = await UserService.checkUserExists({ _id: user_id });
    if (!user) {
      /** this code should be unreachable; only way to
       * reach this is code is if user was logged in
       * before the entry was deleted from db
       * must be a bad user
       */
      const err = new CustomError(
        "Cannot find your login in database! hehe",
        StatusCode.UNAUTHORIZED,
      );
      return next(err);
    }

    const role = user.role_id;

    if (!role) {
      const err = new CustomError(`Invalid role! ${role}`, StatusCode.CONFLICT);
      return next(err);
    }
    if (role.id?.toString() === process.env.SUPERUSER_ROLE_ID) {
      return next();
    }

    const satisfied = permissions_required.every((perm) => {
      if (user.removed_permissions?.includes(perm)) {
        console.error(`Permission ${perm} denied (${Permission[perm]})`);
        return false;
      }

      const perm_given =
        role.permissions.includes(perm) ||
        user.extra_permissions?.includes(perm);
      if (!perm_given) {
        console.error(`Permission ${perm} not satisfied (${Permission[perm]})`);
      }
      return perm_given;
    });

    if (satisfied) {
      return next();
    }

    const err = new CustomError(
      "You do not have permission to access this setting.",
      StatusCode.FORBIDDEN,
    );
    return next(err);
  });

  return protect;
}
