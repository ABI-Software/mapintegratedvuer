import { defineStore } from 'pinia'

/**
 * Activate the store when run the application individually.
 * If the store exist in parent application, 
 * instead of creating a new store it will access the parent main store.
 */
export const useMainStore = defineStore('main', {
  state: () => ({
    userProfile: {
      token: ''
    },
  }),
  getters: {
    userToken(state) {
      return state.userProfile.token
    },
  },
  actions: {
    setUserToken(value) {
      this.userProfile.token = value
    },
  }
})