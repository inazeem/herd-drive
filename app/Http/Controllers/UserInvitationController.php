namespace App\Http\Controllers;

use App\Models\User;
use Common\Core\BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;

class UserInvitationController extends BaseController
{
    public function invite(Request $request)
    {
        $this->validate($request, [
            'email' => 'required|email|unique:users,email',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
        ]);

        // Generate a temporary password
        $tempPassword = Str::random(32);

        // Create the user
        $user = User::create([
            'email' => $request->email,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'password' => Hash::make($tempPassword),
        ]);

        // Generate a signed URL for setting up the password
        $setupUrl = URL::temporarySignedRoute(
            'password.setup',
            now()->addHours(48),
            ['user' => $user->id]
        );

        // Send invitation email
        Mail::send('emails.user-invitation', [
            'user' => $user,
            'setupUrl' => $setupUrl,
        ], function ($message) use ($user) {
            $message->to($user->email)
                   ->subject('Welcome to ' . config('app.name'));
        });

        return $this->success([
            'user' => $user,
            'message' => 'Invitation sent successfully'
        ]);
    }

    public function setupPassword(Request $request, $userId)
    {
        $this->validate($request, [
            'password' => 'required|min:8|confirmed'
        ]);

        $user = User::findOrFail($userId);
        $user->password = Hash::make($request->password);
        $user->save();

        return $this->success([
            'message' => 'Password set successfully'
        ]);
    }
} 