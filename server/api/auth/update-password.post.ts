import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

const PASSWORD_REQUIREMENTS = {
    minLength: 8,
    hasUppercase: /[A-Z]/,
    hasLowercase: /[a-z]/,
    hasNumeric: /[0-9]/,
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
}

function validatePasswordStrength(password: string): {
    isValid: boolean
    errors: string[]
} {
    const errors: string[] = []

    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
        errors.push(
            `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`,
        )
    }

    if (!PASSWORD_REQUIREMENTS.hasUppercase.test(password)) {
        errors.push('Password must contain at least one uppercase letter (A-Z)')
    }

    if (!PASSWORD_REQUIREMENTS.hasLowercase.test(password)) {
        errors.push('Password must contain at least one lowercase letter (a-z)')
    }

    if (!PASSWORD_REQUIREMENTS.hasNumeric.test(password)) {
        errors.push('Password must contain at least one numeric digit (0-9)')
    }

    if (!PASSWORD_REQUIREMENTS.hasSpecial.test(password)) {
        errors.push(
            'Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)',
        )
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

export default defineEventHandler(async (event) => {
    try {
        const user = await serverSupabaseUser(event)
        const client = await serverSupabaseClient(event)

        const userId = user?.id || user?.sub

        if (!userId) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized',
                data: {
                    message: 'User authentication required',
                },
            })
        }

        const body = await readBody(event)
        const { currentPassword, newPassword, confirmPassword } = body

        // Check all required fields are present
        if (!currentPassword || !newPassword || !confirmPassword) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                data: {
                    message:
                        'Current password, new password, and confirmation are required',
                },
            })
        }

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                data: {
                    message:
                        'New password and confirmation password do not match',
                },
            })
        }

        // Validate new password is different from current
        if (currentPassword === newPassword) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                data: {
                    message:
                        'New password must be different from current password',
                },
            })
        }

        if (!user?.email) {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden',
                data: {
                    message: 'User email not found',
                },
            })
        }

        try {
            // Attempt to sign in with current password
            const { data: signInData, error: signInError } =
                await client.auth.signInWithPassword({
                    email: user.email,
                    password: currentPassword,
                })

            if (signInError || !signInData) {
                throw createError({
                    statusCode: 401,
                    statusMessage: 'Unauthorized',
                    data: {
                        message: 'Current password is incorrect',
                    },
                })
            }
        } catch (signInError: any) {
            if (signInError?.statusCode) {
                throw signInError
            }

            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized',
                data: {
                    message: 'Current password is incorrect',
                },
            })
        }

        const strengthValidation = validatePasswordStrength(newPassword)

        if (!strengthValidation.isValid) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                data: {
                    message: 'Password does not meet security requirements',
                    requirements: strengthValidation.errors,
                },
            })
        }

        try {
            const { error: updateError } =
                await client.auth.admin.updateUserById(userId, {
                    password: newPassword,
                })

            if (updateError) {
                console.error('Password update error:', updateError)
                throw createError({
                    statusCode: 500,
                    statusMessage: 'Internal Server Error',
                    data: {
                        message: 'Failed to update password',
                    },
                })
            }
        } catch (error: any) {
            if (error?.statusCode) {
                throw error
            }

            console.error('Unexpected error updating password:', error)
            throw createError({
                statusCode: 500,
                statusMessage: 'Internal Server Error',
                data: {
                    message: 'Failed to update password',
                },
            })
        }
        // invalidate other sessions
        try {
            const { error: signOutError } = await client.auth.signOut({
                scope: 'others',
            })

            if (signOutError) {
                console.warn(
                    'Warning: Could not sign out other sessions:',
                    signOutError,
                )
            }
        } catch (error: any) {
            console.warn('Error invalidating sessions:', error)
        }

        setResponseStatus(event, 200)
        return {
            success: true,
            message:
                'Password updated successfully. Please log in again with your new password.',
        }
    } catch (error: any) {
        console.error('Update password error:', error)

        if (error?.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            data: {
                message: 'An unexpected error occurred',
            },
        })
    }
})
