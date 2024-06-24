import { request } from "./index.ts"
import { ILoginValues } from "../types/LoginValues";

// Login API endpoint
export function loginAPI(loginValues: ILoginValues) {
  return request({
    method: 'POST',
    url: '/api/login', // Adjust URL if necessary
    data: loginValues,
  });
}

// all user
export function logoutAPI() {
    return request({
        url: "/api/authentication/logout",
        method: "GET",
    });
}

// Update a specific user
export function updateUserAPI(user: any) {
    return request({
        url: `/api/rainbow/user/`,
        method: "PUT",
        data: user,
    })
}

// Get all meets list
export function getMeetsAPI() {
    return request({
        url: `/api/rainbow/meet`,
        method: "GET",
    });
}

// Update a specific meet
export function updateMeetAPI(meet: any) {
    return request({
        url: `/api/rainbow/meet`,
        method: "PUT",
        data: meet,
    })
}

// user
export function changePasswordAPI(oldPass: string, newPass: string, userId: number) {
    return request({
        url: `/api/rainbow/user/changePassword/${oldPass}/${newPass}/${userId}`,
        method: "PUT",
    });
}

// user
export function getUserByIdAPI(userId: number) {
    return request({
        url: `/api/rainbow/user/${userId}`,
        method: "GET",
    });
}

// admin
export function getAllUsersAPI() {
    return request({
        url: "/api/rainbow/user",
        method: "GET",
    });
}

// admin
export function addUserAPI(user: any) {
    return request({
        url: "/api/rainbow/user",
        method: "POST",
        data: user,
    });
}

// admin
export function deleteUserAPI(userId: number) {
    return request({
        url: `/api/rainbow/user/${userId}`,
        method: "DELETE",
    });
}

// admin
export function addMeetAPI(meet: any) {
    return request({
        url: `/api/rainbow/meet`,
        method: "POST",
        data: meet,
    })
}

// admin
export function deleteMeetAPI(meetId: number) {
    return request({
        url: `/api/rainbow/meet/${meetId}`,
        method: "DELETE",
    })
}

// get all event details from folder
export function getEventFiles(folderParams: any) {
    return request({
        url: `/api/rainbow/event/`,
        method: "POST",
        data: folderParams,
    })
}

// get all event details from folder
export function getEventbyMeetId(meetId: any) {
    return request({
        url: `/api/rainbow/event/${meetId}`,
        method: "GET",
    })
}

// update all event details
export function updateEventAPI(eventGroup: any) {
    return request({
        url: `/api/rainbow/updateEventAPI/`,
        method: "POST",
        data: eventGroup,
    })
}