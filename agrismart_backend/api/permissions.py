from rest_framework import permissions


class IsAdminOrStaff(permissions.BasePermission):
    """Allow access only to admin/staff users or users with role='admin'."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return bool(
            getattr(user, "is_staff", False)
            or getattr(user, "is_superuser", False)
            or getattr(user, "role", None) == "admin"
        )


class PreventAdminAccess(permissions.BasePermission):
    """Deny access to users that are admin/staff for regular endpoints.

    Use this on endpoints that should only be accessible by non-admin users.
    """

    def has_permission(self, request, view):
        user = request.user
        # If anonymous, let other permissions handle it
        if not user or not user.is_authenticated:
            return True
        # Deny if user is staff/superuser or explicitly role 'admin'
        if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
            return False
        if getattr(user, "role", None) == "admin":
            return False
        return True
